"use client";

import { useState, useCallback } from "react";
import { X, File, FileText, Image, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
}

interface FileListProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

function getFileIcon(type: string, name: string) {
  if (type.startsWith("image/")) {
    return <Image className="h-4 w-4" />;
  }
  if (
    type.includes("javascript") ||
    type.includes("typescript") ||
    type.includes("json") ||
    name.endsWith(".ts") ||
    name.endsWith(".tsx") ||
    name.endsWith(".js") ||
    name.endsWith(".jsx") ||
    name.endsWith(".py") ||
    name.endsWith(".go") ||
    name.endsWith(".rs")
  ) {
    return <FileCode className="h-4 w-4" />;
  }
  if (type.startsWith("text/") || type.includes("markdown")) {
    return <FileText className="h-4 w-4" />;
  }
  return <File className="h-4 w-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({ files, onFilesChange }: FileListProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const newFiles: UploadedFile[] = [];

      for (const file of droppedFiles) {
        // 限制文件大小 (最大 1MB)
        if (file.size > 1024 * 1024) {
          console.warn(`File ${file.name} is too large (max 1MB)`);
          continue;
        }

        try {
          const content = await readFileContent(file);
          newFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type || "text/plain",
            content,
          });
        } catch (err) {
          console.error(`Failed to read file ${file.name}:`, err);
        }
      }

      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }
    },
    [files, onFilesChange]
  );

  const removeFile = useCallback(
    (id: string) => {
      onFilesChange(files.filter((f) => f.id !== id));
    },
    [files, onFilesChange]
  );

  const clearAllFiles = useCallback(() => {
    onFilesChange([]);
  }, [onFilesChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Files</span>
        {files.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={clearAllFiles}
          >
            清空
          </Button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors min-h-[120px] flex items-center justify-center
          ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }
        `}
      >
        <p className="text-sm text-muted-foreground">
          {isDragging ? "释放以添加文件" : "拖拽文件到这里"}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <ScrollArea className="h-64">
          <div className="space-y-1">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 p-2 rounded-md bg-muted/50 group"
              >
                {getFileIcon(file.type, file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
