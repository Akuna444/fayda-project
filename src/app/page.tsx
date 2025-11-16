'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Download, Loader2 } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append("file", file);

    // Adjust backend URL if needed
    const res = await fetch("http://localhost:8000/api/upload", {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      alert("Upload failed");
      setLoading(false);
      return;
    }

    // Read response as blob and create object URL
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setImageUrl(url);
    setLoading(false);
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Upload PDF to Map to ID
          </CardTitle>
          <CardDescription>
            Upload a PDF file to generate an ID card image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">PDF File</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="cursor-pointer"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={!file || loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Generate
                </>
              )}
            </Button>
          </form>

          {imageUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generated Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl} 
                    className="w-full h-auto max-h-96 object-contain" 
                    alt="Generated ID card" 
                  />
                </div>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a href={imageUrl} download="id_generated.png">
                    <Download className="mr-2 h-4 w-4" />
                    Download Image
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}