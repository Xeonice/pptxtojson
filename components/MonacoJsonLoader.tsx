/**
 * Monaco JSON Loader Component
 * Loads and displays JSON from URLs or direct data using Monaco Editor
 */

"use client";

import { useState, useEffect } from "react";
import { MonacoJsonEditor } from "./MonacoJsonEditor";

interface JsonSource {
  type: 'url' | 'data';
  url?: string;
  data?: any;
  filename?: string;
}

interface MonacoJsonLoaderProps {
  source?: JsonSource;
  readonly?: boolean;
  height?: string;
}

export function MonacoJsonLoader({ 
  source, 
  readonly = false, 
  height = "600px"
}: MonacoJsonLoaderProps) {
  const [jsonContent, setJsonContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedSource, setLoadedSource] = useState<JsonSource | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load JSON from source
  useEffect(() => {
    if (!source) return;

    const loadJson = async () => {
      setLoading(true);
      setError(null);

      try {
        if (source.type === 'url' && source.url) {
          console.log("Loading JSON from URL:", source.url);
          
          // 添加超时和重试机制
          const fetchWithTimeout = async (url: string, timeout = 30000, retries = 3): Promise<Response> => {
            for (let attempt = 1; attempt <= retries; attempt++) {
              try {
                console.log(`Attempt ${attempt}/${retries} to fetch JSON from CDN`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(url, {
                  signal: controller.signal,
                  headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  }
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
              } catch (error) {
                console.warn(`Fetch attempt ${attempt} failed:`, error);
                
                if (attempt === retries) {
                  throw error;
                }
                
                // 等待后重试 (指数退避)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            throw new Error('All retry attempts failed');
          };
          
          const response = await fetchWithTimeout(source.url);
          const data = await response.json();
          const formattedJson = JSON.stringify(data, null, 2);
          setJsonContent(formattedJson);
          setLoadedSource(source);
          
        } else if (source.type === 'data' && source.data) {
          const formattedJson = JSON.stringify(source.data, null, 2);
          setJsonContent(formattedJson);
          setLoadedSource(source);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Failed to load JSON:", errorMessage);
        setError(`Failed to load JSON: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadJson();
  }, [source, refreshKey]);

  const downloadJson = () => {
    if (!jsonContent || typeof document === 'undefined') return;
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = loadedSource?.filename || 'data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!jsonContent) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      alert("Clipboard API not available");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(jsonContent);
      alert("JSON copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy JSON:", err);
      alert("Failed to copy JSON to clipboard");
    }
  };

  const refreshFromUrl = () => {
    if (source?.type === 'url' && source.url) {
      console.log("🔄 Manual refresh triggered for CDN URL");
      // Trigger reload by incrementing refresh key
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <div className="monaco-json-loader">
      {/* Header */}
      <div className="loader-header" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
        padding: "10px",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
      }}>
        <div className="source-info">
          {loadedSource && (
            <div style={{ fontSize: "14px", color: "#666" }}>
              <div>
                <strong>Source:</strong> {loadedSource.type === 'url' ? 'CDN URL' : 'Direct Data'}
              </div>
              {loadedSource.url && (
                <div style={{ 
                  fontSize: "12px", 
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <strong>URL:</strong>
                  <div 
                    title={loadedSource.url}
                    style={{
                      flex: 1,
                      fontFamily: "monospace",
                      fontSize: "11px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      borderRadius: "3px",
                      padding: "2px 6px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "300px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        navigator.clipboard.writeText(loadedSource.url || '');
                        alert('URL copied to clipboard!');
                      }
                    }}
                  >
                    {loadedSource.url}
                  </div>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.open(loadedSource.url, '_blank');
                      }
                    }}
                    style={{
                      padding: "2px 6px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      fontSize: "10px",
                      cursor: "pointer"
                    }}
                  >
                    🔗
                  </button>
                </div>
              )}
              {loadedSource.filename && (
                <div>
                  <strong>File:</strong> {loadedSource.filename}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="header-actions" style={{ display: "flex", gap: "10px" }}>
          {loadedSource?.type === 'url' && (
            <button
              onClick={refreshFromUrl}
              disabled={loading}
              style={{
                padding: "6px 12px",
                backgroundColor: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "12px",
              }}
            >
              🔄 Refresh
            </button>
          )}
          
          <button
            onClick={copyToClipboard}
            disabled={!jsonContent || loading}
            style={{
              padding: "6px 12px",
              backgroundColor: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: (!jsonContent || loading) ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            📋 Copy
          </button>
          
          <button
            onClick={downloadJson}
            disabled={!jsonContent || loading}
            style={{
              padding: "6px 12px",
              backgroundColor: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: (!jsonContent || loading) ? "not-allowed" : "pointer",
              fontSize: "12px",
            }}
          >
            💾 Download
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-indicator" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          backgroundColor: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: "4px",
          marginBottom: "10px",
        }}>
          <div className="spinner" style={{
            width: "20px",
            height: "20px",
            border: "2px solid #ccc",
            borderTop: "2px solid #2196f3",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginRight: "10px",
          }} />
          Loading JSON...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-indicator" style={{
          padding: "15px",
          backgroundColor: "#ffebee",
          border: "1px solid #f44336",
          borderRadius: "4px",
          marginBottom: "10px",
          color: "#c62828",
        }}>
          <h4 style={{ margin: "0 0 10px 0" }}>❌ Loading Error</h4>
          <div style={{ fontSize: "14px", marginBottom: "10px" }}>{error}</div>
          
          {loadedSource?.type === 'url' && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={refreshFromUrl}
                disabled={loading}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "12px",
                }}
              >
                🔄 Retry Loading
              </button>
              <span style={{ fontSize: "12px", color: "#666" }}>
                Network timeout or CDN access issue - try again
              </span>
            </div>
          )}
        </div>
      )}

      {/* Monaco Editor */}
      {!loading && !error && (
        <MonacoJsonEditor
          data={(() => {
            try {
              return jsonContent ? JSON.parse(jsonContent) : null;
            } catch (parseError) {
              console.error("JSON parsing error:", parseError);
              return { error: "Invalid JSON format", content: jsonContent };
            }
          })()}
          height={height}
          readOnly={readonly}
          onCopy={(success) => {
            if (success) {
              console.log("JSON copied to clipboard");
            }
          }}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}