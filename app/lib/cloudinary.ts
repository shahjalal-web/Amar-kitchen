// ব্রাউজার থেকে সরাসরি Cloudinary তে আনসাইনড আপলোড — ব্যাকএন্ডে শুধু URL পাঠানো হয়
export const uploadImageToCloudinary = (
  file: File,
  folder = 'amar-kitchen',
  onProgress?: (percent: number) => void
): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset || '');
    formData.append('folder', folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url as string);
      } else {
        reject(new Error('ছবি আপলোড ব্যর্থ হয়েছে'));
      }
    };

    xhr.onerror = () => reject(new Error('ছবি আপলোড ব্যর্থ হয়েছে'));

    xhr.send(formData);
  });
};
