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

      const response = await axios.post("/api/process-pdf", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
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
            <GeneratedIDCardPreview data={extractedData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Exact replica of the reverse-engineered ID card front page
function GeneratedIDCardPreview({ data }: { data: any }) {
  const frontImageUrl = '/front-template.jpg'; // Use the same background image

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Preview of ID Card</h3>
      <div 
        className="relative mx-auto border-2 border-gray-300"
        style={{ 
          height: '800px', 
          width: '1280px',
          backgroundImage: `url("${frontImageUrl}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        }}
      >
    

        {/* Profile Images */}
        {data.images && data.images.length > 0 && (
          <>
            <img 
              src={`https://api.fayda.pro.et/${data.images[0]}`} 
              alt="Profile" 
              className="absolute"
              style={{ 
                top: '200px', 
                left: '55px',
                width: '440px',
                height: '540px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
            <img 
              src={`https://api.fayda.pro.et/${data.images[0]}`} 
              alt="Profile" 
              className="absolute"
              style={{ 
                bottom: '70px', 
                right: '150px',
                width: '100px',
                height: '130px',
                objectFit: 'fill',
                borderRadius: '4px'
              }}
            />
          </>
        )}

        {/* Barcode/ID Number SVG */}
        <div className="absolute high-quality" style={{ top: '635px', left: '532px' }}>
          <svg width="432px" height="90px" viewBox="0 0 232 65" xmlns="http://www.w3.org/2000/svg" version="1.1">
            <rect x="0" y="0" width="232" height="65" style={{fill:'#ffffff'}}></rect>
            <g transform="translate(5, 5)" style={{fill:'#000000'}}>
              {/* Barcode lines - simplified version */}
              <rect x="0" y="25" width="2" height="30"></rect>
              <rect x="3" y="25" width="1" height="30"></rect>
              <rect x="6" y="25" width="3" height="30"></rect>
              <rect x="11" y="25" width="2" height="30"></rect>
              <rect x="16" y="25" width="1" height="30"></rect>
              <rect x="18" y="25" width="1" height="30"></rect>
              <rect x="22" y="25" width="1" height="30"></rect>
              <rect x="25" y="25" width="3" height="30"></rect>
              <rect x="30" y="25" width="2" height="30"></rect>
              <rect x="33" y="25" width="3" height="30"></rect>
              <rect x="37" y="25" width="1" height="30"></rect>
              <rect x="39" y="25" width="4" height="30"></rect>
              <rect x="44" y="25" width="2" height="30"></rect>
              <rect x="47" y="25" width="2" height="30"></rect>
              <rect x="51" y="25" width="2" height="30"></rect>
              <rect x="55" y="25" width="1" height="30"></rect>
              <rect x="57" y="25" width="3" height="30"></rect>
              <rect x="61" y="25" width="4" height="30"></rect>
              <rect x="66" y="25" width="2" height="30"></rect>
              <rect x="69" y="25" width="1" height="30"></rect>
              <rect x="73" y="25" width="3" height="30"></rect>
              <rect x="77" y="25" width="1" height="30"></rect>
              <rect x="82" y="25" width="2" height="30"></rect>
              <rect x="85" y="25" width="1" height="30"></rect>
              <rect x="88" y="25" width="3" height="30"></rect>
              <rect x="92" y="25" width="1" height="30"></rect>
              <rect x="94" y="25" width="4" height="30"></rect>
              <rect x="99" y="25" width="2" height="30"></rect>
              <rect x="102" y="25" width="2" height="30"></rect>
              <rect x="106" y="25" width="2" height="30"></rect>
              <rect x="110" y="25" width="1" height="30"></rect>
              <rect x="112" y="25" width="3" height="30"></rect>
              <rect x="116" y="25" width="4" height="30"></rect>
              <rect x="121" y="25" width="1" height="30"></rect>
              <rect x="125" y="25" width="1" height="30"></rect>
              <rect x="128" y="25" width="2" height="30"></rect>
              <rect x="132" y="25" width="3" height="30"></rect>
              <rect x="136" y="25" width="2" height="30"></rect>
              <rect x="139" y="25" width="3" height="30"></rect>
              <rect x="143" y="25" width="3" height="30"></rect>
              <rect x="147" y="25" width="1" height="30"></rect>
              <rect x="149" y="25" width="4" height="30"></rect>
              <rect x="154" y="25" width="2" height="30"></rect>
              <rect x="157" y="25" width="2" height="30"></rect>
              <rect x="161" y="25" width="2" height="30"></rect>
              <rect x="165" y="25" width="1" height="30"></rect>
              <rect x="167" y="25" width="3" height="30"></rect>
              <rect x="171" y="25" width="4" height="30"></rect>
              <rect x="176" y="25" width="1" height="30"></rect>
              <rect x="180" y="25" width="4" height="30"></rect>
              <rect x="185" y="25" width="1" height="30"></rect>
              <rect x="187" y="25" width="1" height="30"></rect>
              <rect x="190" y="25" width="4" height="30"></rect>
              <rect x="195" y="25" width="1" height="30"></rect>
              <rect x="198" y="25" width="3" height="30"></rect>
              <rect x="203" y="25" width="2" height="30"></rect>
              <rect x="206" y="25" width="1" height="30"></rect>
              <rect x="209" y="25" width="2" height="30"></rect>
              <rect x="214" y="25" width="3" height="30"></rect>
              <rect x="218" y="25" width="1" height="30"></rect>
              <rect x="220" y="25" width="2" height="30"></rect>
              <text style={{font:'bold 23px MyriadPro'}} textAnchor="middle" x="111" y="21">
                {data.fcn_id || '4017 4973 0523 7984'}
              </text>
            </g>
          </svg>
        </div>

        {/* Full Name Data */}
        <div className="absolute" style={{ top: '215px', left: '512px' }}>
          <p className="amharic-text text-xl font-bold text-black">{data.amharic_name || 'የኃለሽት አየለ ጉብረሖት'}</p>
          <p className="english-text text-xl font-bold text-black">{data.english_name || 'Yehualeshet Ayele Gebrehot'}</p>
        </div>

        {/* Date of Birth Data */}
        <div className="absolute" style={{ top: '380px', left: '510px' }}>
          <p className="amharic-text text-xl font-bold text-black">
            {data.birth_date_ethiopian || '11/06/1991'} | {data.birth_date_gregorian || '1999/Feb/18'}
          </p>
        </div>

        {/* Sex Data */}
        <div className="absolute" style={{ top: '462px', left: '510px' }}>
          <p className="amharic-text text-xl font-bold text-black">
            {data.amharic_gender || 'ሴት'} | {data.english_gender || 'Female'}
          </p>
        </div>

        {/* Date of Issue Data */}
        <div className="absolute high-quality" style={{ top: '514px', left: '-28px' }}>
          <p className="amharic-text rotate-90 text-xl font-bold text-black">{data.issue_date_ethiopian || '2018/03/08'}</p>
        </div>

        <div className="absolute high-quality" style={{ top: '150px', left: '-28px' }}>
          <p className="english-text rotate-90 text-xl font-bold text-black">{data.issue_date_gregorian || '2025/Nov/17'}</p>
        </div>

        {/* Date of Expiry Data */}
        <div className="absolute" style={{ top: '550px', left: '515px' }}>
          <p className="amharic-text text-xl font-bold text-black">
            {data.expiry_date_ethiopian || '2026/03/08'} | {data.expiry_date_gregorian || '2033/Nov/17'}
          </p>
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <Button  variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download JSON
        </Button>
        <Button onClick={() => window.print()}>
          Print ID Card
        </Button>
      </div>
    </div>
  );
}