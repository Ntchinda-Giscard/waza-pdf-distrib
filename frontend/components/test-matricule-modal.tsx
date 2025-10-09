"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText } from "lucide-react";
import { Input } from "./ui/input";

interface TestMatriculeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestMatriculeModal({
  open,
  onOpenChange,
}: TestMatriculeModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setError("");
    } else {
      setError("Please select a valid PDF file");
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Replace with your actual FastAPI backend URL
      const response = await fetch("http://localhost:8000/api/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract text from PDF");
      }

      const data = await response.json();
      setExtractedText(data.extracted_text || data.text || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setExtractedText("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            Test Matricule Extraction
          </DialogTitle>
          <DialogDescription>
            <p className="text-sm text-gray-400">
              Upload an example PDF document to test the matricule extraction
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Picker */}
          <div className="space-y-2">
            <Label htmlFor="pdf-upload" className="text-white">
              Upload Example PDF
            </Label>
            <div className="flex items-center gap-2">
              <label
                htmlFor="pdf-upload"
                className="flex h-10 flex-1 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground"
              >
                <Upload className="h-4 w-4 bg-gray-800 border-gray-700 text-white" />
                <span className="text-muted-foreground">
                  {selectedFile ? selectedFile.name : "Choose a PDF file..."}
                </span>
              </label>
              <Input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="sr-only bg-gray-800 border-gray-700 text-white"
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isLoading}
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  "Extract Text"
                )}
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Extracted Text Display */}
          {extractedText && (
            <div className="space-y-2">
              <Label>Extracted Text</Label>
              <div className="rounded-md border bg-muted p-4">
                <div className="flex items-start gap-2">
                  <FileText className="mt-1 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {extractedText}
                  </p>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-pretty">
                  <strong>Instructions:</strong> Please copy the last word or
                  sentence that appears <strong>before</strong> the matricule
                  number in the text above. You'll paste this as the reference
                  text in the main form.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            Finish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
