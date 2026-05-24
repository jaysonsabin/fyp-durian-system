/**
 * Uploads an image file to the public 'forum_images' bucket on Supabase using REST API.
 * @param {File} file - The file object to upload.
 * @returns {Promise<string>} The public URL of the uploaded image.
 */
export async function uploadForumImage(file) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pcuvvkvpoowidzltiqmt.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error("Supabase Anon Key is not configured. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.");
  }

  // Generate a clean and unique filename to prevent overwrites
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
  const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}`;

  // Supabase Storage REST Upload Endpoint
  const uploadUrl = `${supabaseUrl}/storage/v1/object/forum_images/${uniqueFileName}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${supabaseKey}`,
      "apikey": supabaseKey,
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${errorText || response.statusText}`);
  }

  // Build and return the public URL for the image
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/forum_images/${uniqueFileName}`;
  return publicUrl;
}
