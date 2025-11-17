'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Download, Loader2 } from "lucide-react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jwtToken, setJwtToken] = useState<string>("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF file");
      return;
    }
    if (!jwtToken) {
      setError("Please enter JWT token");
      return;
    }

    setLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jwtToken", jwtToken);

      // Use local Next.js API route as proxy
      const response = await axios.post("/api/process-pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // Increase timeout for file processing
      });

      

      if (response.data.success) {
        setExtractedData(response.data);
      } else {
        setError("Failed to process the document: " + (response.data.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          "Upload failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const downloadData = () => {
    if (!extractedData) return;

    const dataStr = JSON.stringify(extractedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "extracted_id_data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Ethiopian ID Card Data Extractor
          </CardTitle>
          <CardDescription>
            Upload a PDF file to extract Ethiopian ID card information
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
                onChange={(e) => {
                  setFile(e.target.files ? e.target.files[0] : null);
                  setError(null);
                }}
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jwt-token">JWT Token</Label>
              <Input
                id="jwt-token"
                type="text"
                value={jwtToken}
                onChange={(e) => {
                  setJwtToken(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your JWT authentication token"
                className="cursor-pointer"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!file || !jwtToken || loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing PDF...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Extract Data
                </>
              )}
            </Button>
          </form>

          {extractedData && (
            <ExtractedDataView 
              data={extractedData} 
              onDownload={downloadData} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Extracted data display component
function ExtractedDataView({ data, onDownload }: { data: any; onDownload: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Extracted ID Card Data</span>
          <Button onClick={onDownload} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display extracted images */}
        {data.images && data.images.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Extracted Pages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.images.map((img: string, index: number) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img
                    src={`https://api.fayda.pro.et/${img}`}
                    alt={`Extracted page ${index + 1}`}
                    className="w-full h-auto object-contain max-h-64"
                  />
                  <p className="text-center text-sm p-2 bg-gray-50">
                    Page {index + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data fields display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DataSection title="Personal Information" fields={[
            { label: "English Name", value: data.english_name },
            { label: "Amharic Name", value: data.amharic_name },
            { label: "Gender (English)", value: data.english_gender },
            { label: "Gender (Amharic)", value: data.amharic_gender },
            { label: "Nationality (English)", value: data.english_nationality },
            { label: "Nationality (Amharic)", value: data.amharic_nationality },
          ]} />

          <DataSection title="Location Information" fields={[
            { label: "City (English)", value: data.english_city },
            { label: "City (Amharic)", value: data.amharic_city },
            { label: "Sub-city (English)", value: data.english_sub_city },
            { label: "Sub-city (Amharic)", value: data.amharic_sub_city },
            { label: "Woreda (English)", value: data.english_woreda },
            { label: "Woreda (Amharic)", value: data.amharic_woreda },
          ]} />

          <DataSection title="Birth Dates" fields={[
            { label: "Ethiopian Calendar", value: data.birth_date_ethiopian },
            { label: "Gregorian Calendar", value: data.birth_date_gregorian },
          ]} />

          <DataSection title="Document Dates" fields={[
            { label: "Issue Date (Gregorian)", value: data.issue_date_gregorian },
            { label: "Issue Date (Ethiopian)", value: data.issue_date_ethiopian },
            { label: "Expiry Date (Gregorian)", value: data.expiry_date_gregorian },
            { label: "Expiry Date (Ethiopian)", value: data.expiry_date_ethiopian },
          ]} />

          <DataSection title="Identification Numbers" fields={[
            { label: "FCN ID", value: data.fcn_id },
            { label: "FIN Number", value: data.fin_number },
            { label: "Phone Number", value: data.phone_number },
          ]} />
        </div>
      </CardContent>
    </Card>
  );
}

function DataSection({ title, fields }: { title: string; fields: Array<{ label: string; value: string }> }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold border-b pb-2">{title}</h3>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <DataField key={index} label={field.label} value={field.value} />
        ))}
      </div>
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="text-sm text-gray-900">{value || "Not available"}</span>
    </div>
  );
}