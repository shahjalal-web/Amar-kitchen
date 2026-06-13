'use client';
import { useId, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { uploadImageToCloudinary } from '../../lib/cloudinary';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export default function ImageUpload({ value, onChange, folder, label }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadImageToCloudinary(file, folder, setProgress);
      onChange(url);
    } catch {
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>}

      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
          {value && (
            <Image src={value} alt="preview" fill className="object-cover" />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-1">
              <div className="w-7 h-7 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
              <span className="text-[10px] font-medium text-orange-600">{progress}%</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor={inputId}
            className={`inline-flex items-center gap-2 cursor-pointer font-medium px-4 py-2 rounded-xl transition text-sm ${
              uploading
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
            }`}
          >
            {uploading ? '⏳ আপলোড হচ্ছে...' : '📷 ছবি আপলোড করুন'}
          </label>

          {uploading && (
            <div className="w-full max-w-[200px] bg-stone-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
