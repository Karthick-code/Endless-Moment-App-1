import React, { useEffect, useRef, useState } from 'react';
import { X, Save, Trash2, MapPin, ImagePlus, Upload, LoaderCircle } from 'lucide-react';
import { api } from '../../services/api';

const emptyProject = {
  _id: '', title: '', description: '', category: 'wedding', images: [],
  clientName: '', location: '', shootDate: '', featured: false,
};
const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 900_000;

// Compress selected photos before uploading them to Cloudinary, keeping mobile uploads practical.
const fileToCompressedDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file.type.startsWith('image/')) return reject(new Error(`${file.name} is not an image.`));
  const reader = new FileReader();
  reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
  reader.onload = () => {
    const image = new Image();
    image.onerror = () => reject(new Error(`Could not process ${file.name}.`));
    image.onload = () => {
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) return reject(new Error('Your browser cannot process this image.'));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let quality = 0.82;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length * 0.75 > MAX_IMAGE_BYTES && quality > 0.45) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      if (dataUrl.length * 0.75 > MAX_IMAGE_BYTES) return reject(new Error(`${file.name} is too large after compression. Choose a smaller image.`));
      resolve(dataUrl);
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

export const ProjectModal = ({ project, isOpen, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState(emptyProject);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [error, setError] = useState('');
  const [processingImages, setProcessingImages] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (project) setFormData({ ...emptyProject, ...project, images: Array.isArray(project.images) ? project.images : [] });
    else setFormData({ ...emptyProject, _id: `proj_${Date.now()}`, images: [] });
    setImageUrlInput('');
    setError('');
    setProcessingImages(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleFilesSelected = async (event) => {
    const files = Array.from(event.target.files || []);
    // Clear the input so selecting the same photo again also triggers change.
    event.target.value = '';
    if (!files.length) return;
    const remaining = MAX_IMAGES - formData.images.length;
    if (remaining <= 0) { setError(`You can attach up to ${MAX_IMAGES} photos to one project.`); return; }
    if (files.length > remaining) { setError(`You can add ${remaining} more photo(s). Select up to ${remaining} at a time.`); return; }
    setProcessingImages(true);
    setError('');
    try {
      const compressed = await Promise.all(files.map(fileToCompressedDataUrl));
      const uploaded = await Promise.all(compressed.map((dataUrl) => api.uploadProjectImage(dataUrl)));
      const imageUrls = uploaded.map((item) => item.imageUrl).filter(Boolean);
      if (imageUrls.length !== files.length) throw new Error('One or more photos could not be uploaded to Cloudinary.');
      setFormData((current) => ({ ...current, images: [...current.images, ...imageUrls] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload the selected photo to Cloudinary.');
    } finally {
      setProcessingImages(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!formData.title.trim()) { setError('Shoot title is required.'); return; }
    if (!formData.description.trim()) { setError('Description is required.'); return; }
    if (!formData.images.length) { setError('Select at least one photo using Choose Photos, or add an image URL.'); return; }
    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this project.');
      return;
    }
    onClose();
  };

  const addImageUrl = () => {
    const value = imageUrlInput.trim();
    if (!value) return;
    if (formData.images.length >= MAX_IMAGES) { setError(`You can attach up to ${MAX_IMAGES} photos to one project.`); return; }
    try {
      const parsed = new URL(value);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      setError('Enter a valid image URL starting with https:// or http://.');
      return;
    }
    setFormData((current) => ({ ...current, images: [...current.images, value] }));
    setImageUrlInput('');
    setError('');
  };

  const removeImage = (index) => setFormData((current) => ({ ...current, images: current.images.filter((_, i) => i !== index) }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl">
        <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
          <div><span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">Studio Showcase</span><h3 className="text-lg font-serif font-bold text-white mt-0.5">{project ? 'Edit Portfolio Shoot' : 'Upload New Studio Shoot'}</h3></div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white" aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-zinc-200">
          {error && <div role="alert" className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-zinc-400 font-bold mb-1">Shoot Title *</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Wedding at sunset" className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 outline-none focus:border-amber-400" required /></div>
            <div><label className="block text-zinc-400 font-bold mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 outline-none focus:border-amber-400 text-zinc-200"><option value="wedding">Wedding</option><option value="pre-wedding">Pre-Wedding</option><option value="portrait">Portrait</option><option value="cinematography">Cinematography</option><option value="commercial">Commercial</option><option value="other">Other</option></select></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-zinc-400 font-bold mb-1">Couple / Client Name</label><input type="text" value={formData.clientName || ''} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} placeholder="Client name (optional)" className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 outline-none focus:border-amber-400" /></div>
            <div><label className="block text-zinc-400 font-bold mb-1">Location / Venue</label><div className="relative"><MapPin className="absolute left-3 top-3 size-4 text-zinc-500" /><input type="text" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Location / venue" className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2.5 outline-none focus:border-amber-400" /></div></div>
          </div>
          <div><label className="block text-zinc-400 font-bold mb-1">Story / Description *</label><textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe this shoot..." className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 outline-none focus:border-amber-400 resize-none text-xs" required /></div>
          <section className="space-y-2">
            <div><label className="block text-zinc-300 font-bold mb-1">Project Photos</label><p className="text-[11px] text-zinc-500">Photos are uploaded to Cloudinary immediately; only their image URLs are saved with the project. Up to {MAX_IMAGES} photos per project.</p></div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesSelected} className="sr-only" aria-label="Choose project photos" />
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={processingImages || formData.images.length >= MAX_IMAGES} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm transition"><ImagePlus size={17} />{processingImages ? 'Uploading to Cloudinary…' : 'Choose Photos from Device'}</button>
            {processingImages && <p className="flex items-center gap-2 text-amber-300"><LoaderCircle size={14} className="animate-spin" />Compressing and uploading selected photos to Cloudinary…</p>}
            <div className="flex gap-2"><input type="url" value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="Or paste an image URL (optional)" className="min-w-0 flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 outline-none focus:border-amber-400" /><button type="button" onClick={addImageUrl} className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs"><Upload size={14} className="inline mr-1" />Add URL</button></div>
            {formData.images.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">{formData.images.map((img, i) => <div key={`${i}-${img.slice(0, 20)}`} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950"><img src={img} alt={`Project preview ${i + 1}`} className="w-full h-full object-cover" /><button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1.5 rounded-full bg-black/80 text-white hover:bg-red-600" aria-label={`Remove photo ${i + 1}`}><X size={13} /></button><span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white">Cloudinary URL {i + 1}</span></div>)}</div>}
          </section>
          <div className="pt-2 flex items-center justify-between border-t border-zinc-800 gap-2">
            {project && onDelete ? <button type="button" onClick={() => { if (window.confirm('Delete this project from portfolio?')) { onDelete(project._id); onClose(); } }} className="px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5 transition"><Trash2 size={14} /><span>Delete</span></button> : <div />}
            <div className="flex items-center gap-2"><button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition">Cancel</button><button type="submit" disabled={processingImages} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition shadow-md"><Save size={14} /><span>Save Shoot</span></button></div>
          </div>
        </form>
      </div>
    </div>
  );
};
