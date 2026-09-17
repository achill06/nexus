import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

export default function UploadResume() {
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [resumeId, setResumeId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const dragDepthRef = useRef(0);

  function selectFile(selected) {
    if (!selected) return;

    const isPdf =
      selected.type === 'application/pdf' ||
      selected.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setFile(null);
      setStatus('error');
      setErrorMessage('Please choose a PDF resume.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setStatus('error');
      setErrorMessage('Your resume must be smaller than 10MB.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setFile(selected);
    setStatus('idle');
    setErrorMessage('');
  }

  function handleFileChange(e) {
    selectFile(e.target.files?.[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (status !== 'uploading') setIsDragging(true);
  }

  function handleDragEnter(e) {
    e.preventDefault();
    if (status !== 'uploading') {
      dragDepthRef.current += 1;
      setIsDragging(true);
    }
  }

  function handleDragLeave(e) {
    e.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (status !== 'uploading') selectFile(e.dataTransfer.files?.[0]);
  }

  function handleDropzoneKeyDown(e) {
    if (status === 'uploading') return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const result = await api.postForm('/matching/resume', formData);
      setResumeId(result.resumeId);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof ApiError ? err.message : 'Upload failed. Try again.');
    }
  }

  function reset() {
    setFile(null);
    setStatus('idle');
    setErrorMessage('');
    setResumeId(null);
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Upload resume</h1>
          <p className="page-subhead">
            Add your latest resume to unlock personalized job matches.
          </p>
        </div>
      </header>

      {status === 'success' ? (
        <div className="panel panel-success" role="status">
          <p>Resume uploaded and embedded successfully (resume #{resumeId}).</p>
          <div className="panel-actions">
            <Link to="/matches" className="btn btn-primary">
              View your matches
            </Link>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Upload a different resume
            </button>
          </div>
        </div>
      ) : (
        <section className="upload-panel">
          <div className="upload-panel-heading">
            <div>
              <p className="eyebrow">Resume matching</p>
              <h2>Bring your experience into focus</h2>
            </div>
            <span className="upload-limit">PDF · max 10MB</span>
          </div>

          <label
            className={'file-drop' + (isDragging ? ' file-drop-active' : '')}
            role="button"
            tabIndex={status === 'uploading' ? -1 : 0}
            aria-label="Choose or drop a PDF resume"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={handleDropzoneKeyDown}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={status === 'uploading'}
              tabIndex={-1}
            />
            <span className="file-drop-icon" aria-hidden="true">↑</span>
            <span className="file-drop-content">
              <span className="file-drop-label">
                {file ? file.name : 'Drop your resume here'}
              </span>
              <span className="file-drop-hint">
                {file ? 'Ready to upload' : 'or click to browse your files'}
              </span>
            </span>
          </label>

          {errorMessage && (
            <p className="form-error" role="alert">{errorMessage}</p>
          )}

          {status === 'uploading' ? (
            <LoadingSpinner label="Parsing and embedding your resume…" />
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file}
            >
              Upload and analyze
            </button>
          )}
        </section>
      )}
    </div>
  );
}
