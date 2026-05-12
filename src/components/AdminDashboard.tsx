import React, { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, writeBatch } from 'firebase/firestore';
import { Question, MediaType } from '../types';
import { Plus, Trash2, Edit2, Image as ImageIcon, Video, Type, Save, X, Shuffle, ArrowUp, ArrowDown, Upload, AlertCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form state
  const [text, setText] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [answer, setAnswer] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    const q = collection(db, 'questions');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const qs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      // Sort in memory to include questions without 'order' field
      qs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setQuestions(qs);
    }, (err) => {
      console.error("Admin snapshot error:", err);
    });
    return () => unsubscribe();
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = (q?: Question) => {
    setErrorMsg(null);
    if (q) {
      setEditingQuestion(q);
      setText(q.text);
      setMediaType(q.mediaType);
      setMediaUrl(q.mediaUrl || '');
      setAnswer(q.answer);
      setTitle(q.title);
    } else {
      setEditingQuestion(null);
      setText('');
      setMediaType('text');
      setMediaUrl('');
      setAnswer('');
      setTitle('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const data = {
      text: text.trim(),
      mediaType,
      mediaUrl: mediaUrl.trim() || null,
      answer: answer.trim(),
      title: title.trim(),
      order: editingQuestion ? editingQuestion.order : questions.length
    };

    try {
      if (editingQuestion) {
        await updateDoc(doc(db, 'questions', editingQuestion.id), data);
      } else {
        await addDoc(collection(db, 'questions'), data);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Save error:", err);
      let message = "Saqlashda xatolik yuz berdi. Iltimos, qayta urinib ko'ring.";
      if (err.message && err.message.includes('too large')) {
        message = "Fayl hajmi juda katta (maksimal 1MB). Iltimos, kichikroq fayl yuklang.";
      } else if (err.message) {
        message = `Xatolik: ${err.message}`;
      }
      setErrorMsg(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit for Firestore
      setErrorMsg("Fayl hajmi 1MB dan katta. Bu Firestore uchun juda katta bo'lishi mumkin.");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ushbu savolni o\'chirmoqchimisiz?')) return;
    try {
      await deleteDoc(doc(db, 'questions', id));
    } catch (err: any) {
      console.error("Delete error:", err);
    }
  };

  const handleShuffle = async () => {
    setIsSaving(true);
    try {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      const batch = writeBatch(db);
      shuffled.forEach((q, index) => {
        const ref = doc(db, 'questions', q.id);
        batch.update(ref, { order: index });
      });
      await batch.commit();
    } catch (err: any) {
      console.error("Shuffle error:", err);
      alert("Xatolik: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bento-card bg-bento-card/50 backdrop-blur-md flex-row justify-between items-center p-8 border-bento-blue/20">
        <div>
          <div className="bento-badge">BOSHQARUV PANELİ</div>
          <h2 className="text-3xl font-black tracking-tighter">Savollar Bazasi</h2>
          <p className="text-slate-500 text-xs mt-1 font-bold">Jami {questions.length} ta intellektual topshiriq mavjud</p>
        </div>
        <div className="flex gap-3">
          <button 
            disabled={isSaving}
            onClick={async () => {
              if (confirm('Savollarni alifbo tartibida tartiblamoqchimisiz?')) {
                setIsSaving(true);
                try {
                  const sorted = [...questions].sort((a, b) => a.title.localeCompare(b.title));
                  const batch = writeBatch(db);
                  sorted.forEach((q, index) => {
                    batch.update(doc(db, 'questions', q.id), { order: index });
                  });
                  await batch.commit();
                } catch (err: any) {
                  console.error("Sort error:", err);
                  alert("Xatolik: " + err.message);
                } finally {
                  setIsSaving(false);
                }
              }
            }}
            className="bento-btn flex items-center gap-2 border border-white/10 text-slate-400 disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Tartiblash
          </button>
          <button 
            disabled={isSaving}
            onClick={handleShuffle}
            className="bento-btn flex items-center gap-2 border border-white/10 disabled:opacity-50"
          >
            <Shuffle size={14} />
            Aralashtirish
          </button>
          <button 
            onClick={() => openModal()}
            className="bento-btn-accent flex items-center gap-2"
          >
            <Plus size={14} />
            Savol Qo'shish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {questions.map((q) => (
          <motion.div 
            layout
            key={q.id}
            className="bento-card group hover:border-bento-accent/50 hover:shadow-xl hover:shadow-amber-500/5 cursor-default relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-xs font-black group-hover:scale-110 transition-transform text-slate-400 overflow-hidden px-1 text-center">
                {q.title}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                <button 
                  onClick={() => openModal(q)}
                  className="p-2 bg-[#334155] rounded-md hover:bg-bento-accent hover:text-bento-bg transition-colors"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={() => handleDelete(q.id)}
                  className="p-2 bg-red-500/10 rounded-md hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-bento-accent mb-2 truncate">{q.title}</h4>
            <p className="text-sm font-bold text-slate-300 line-clamp-3 mb-6 leading-relaxed">{q.text}</p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                {q.mediaType === 'image' && <ImageIcon size={12} className="text-blue-400" />}
                {q.mediaType === 'video' && <Video size={12} className="text-red-400" />}
                {q.mediaType === 'text' && <Type size={12} className="text-green-400" />}
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">
                  {q.mediaType}
                </span>
              </div>
              <div className="text-[9px] font-mono text-white/20">#{q.order.toString().padStart(2, '0')}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bento-bg/90 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bento-card border border-bento-border w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative my-8"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-bento-accent" />
              <form onSubmit={handleSave} className="p-10 space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-2xl font-black tracking-tighter">
                    {editingQuestion ? 'Savolni Tahrirlash' : 'Yangi Savol'}
                  </h3>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={14} />
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Savol Nomi (Hammaga ko'rinadi)</label>
                  <input 
                    required
                    disabled={isSaving}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black/40 border border-bento-border rounded-lg px-4 py-3 text-sm focus:border-bento-accent outline-none transition-all placeholder:text-slate-700 disabled:opacity-50"
                    placeholder="Masalan: SAVOL #1 yoki MANTIQ"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Savol Matni</label>
                  <textarea 
                    required
                    disabled={isSaving}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-black/40 border border-bento-border rounded-lg px-4 py-3 text-sm focus:border-bento-accent outline-none transition-all h-32 resize-none placeholder:text-slate-700 disabled:opacity-50"
                    placeholder="Savol qanday?"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Media Turi</label>
                  <div className="flex gap-2">
                    {(['text', 'image', 'video'] as MediaType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setMediaType(type);
                          if (type === 'text') setMediaUrl('');
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${mediaType === type ? 'bg-bento-accent text-bento-bg border-bento-accent' : 'bg-black/20 border-bento-border text-slate-500 hover:border-slate-700'}`}
                      >
                        {type === 'text' && <Type size={12} />}
                        {type === 'image' && <ImageIcon size={12} />}
                        {type === 'video' && <Video size={12} />}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {mediaType !== 'text' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fayl yuklash</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-24 bg-black/40 border border-dashed border-bento-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-bento-accent/50 transition-all group"
                      >
                        <Upload size={20} className="text-slate-600 group-hover:text-bento-accent mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Faylni tanlash</span>
                        <span className="text-[8px] text-red-400 font-bold mt-1 uppercase">Video uchun maksimal 1MB! (Katta fayllarni link orqali qo'ying)</span>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden" 
                          accept={mediaType === 'image' ? "image/*" : "video/*"}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Yoki Media URL kiriting</label>
                      <input 
                        disabled={isSaving}
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        className="w-full bg-black/40 border border-bento-border rounded-lg px-4 py-3 text-sm focus:border-bento-accent outline-none transition-all placeholder:text-slate-700 disabled:opacity-50"
                        placeholder="Rasm yoki video havolasi (link)"
                      />
                    </div>

                    {mediaUrl && (
                      <div className="rounded-lg overflow-hidden border border-bento-border bg-black/20 aspect-video flex items-center justify-center relative group">
                        <button 
                          type="button" 
                          onClick={() => setMediaUrl('')}
                          className="absolute top-2 right-2 p-1 bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                        {mediaType === 'image' ? (
                          <img src={mediaUrl} className="w-full h-full object-contain" alt="Preview" />
                        ) : (
                          <video src={mediaUrl} className="w-full h-full" controls />
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Javob</label>
                  <input 
                    required
                    disabled={isSaving}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full bg-black/40 border border-bento-border rounded-lg px-4 py-3 text-sm focus:border-bento-accent outline-none transition-all placeholder:text-slate-700 disabled:opacity-50"
                    placeholder="To'g'ri javobni kiriting"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full bento-btn-accent py-4 text-xs shadow-xl shadow-amber-500/10 flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSaving ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Save size={16} />
                    </motion.div>
                  ) : (
                    <Save size={16} />
                  )}
                  {isSaving ? 'Saqlanmoqda...' : 'Savolni Saqlash'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
