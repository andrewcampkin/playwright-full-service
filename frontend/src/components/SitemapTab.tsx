import { useState, useEffect } from 'react';
import { Plus, Globe, Map, Trash2, Search, Key, ExternalLink } from 'lucide-react';

interface Page {
  url: string;
  title: string;
  description: string;
  h1: string;
  headings: string[];
  links: any[];
  forms: any[];
  timestamp: string;
  manual?: boolean;
  error?: string;
}

interface Secret {
  id: string;
  name: string;
  key: string;
  value: string;
  type: string;
  description?: string;
}

interface Sitemap {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  pages: Page[];
  blockedPages: any[];
  inputFields: any[];
  status: string;
  secrets: Secret[];
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  websites: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

export default function SitemapTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('');
  const [sitemaps, setSitemaps] = useState<Sitemap[]>([]);
  const [selectedSitemap, setSelectedSitemap] = useState<Sitemap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New sitemap form
  const [showNewSitemapForm, setShowNewSitemapForm] = useState(false);
  const [newSitemapName, setNewSitemapName] = useState('');
  const [newSitemapDescription, setNewSitemapDescription] = useState('');
  const [newSitemapUrl, setNewSitemapUrl] = useState('');

  // Add page form
  const [showAddPageForm, setShowAddPageForm] = useState(false);
  const [newPageUrl, setNewPageUrl] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageDescription, setNewPageDescription] = useState('');

  // Add secret form
  const [showAddSecretForm, setShowAddSecretForm] = useState(false);
  const [newSecretName, setNewSecretName] = useState('');
  const [newSecretKey, setNewSecretKey] = useState('');
  const [newSecretValue, setNewSecretValue] = useState('');
  const [newSecretType, setNewSecretType] = useState('text');
  const [newSecretDescription, setNewSecretDescription] = useState('');

  // Crawl settings
  const [crawlSettings, setCrawlSettings] = useState({
    maxPages: 50,
    maxDepth: 3
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedWebsiteId) {
      fetchSitemaps();
    }
  }, [selectedWebsiteId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/protected/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchSitemaps = async () => {
    if (!selectedWebsiteId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/protected/sitemaps?websiteId=${selectedWebsiteId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSitemaps(data.data);
      }
    } catch (error) {
      console.error('Error fetching sitemaps:', error);
      setError('Failed to fetch sitemaps');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSitemapDetails = async (sitemapId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/protected/sitemaps/${sitemapId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedSitemap(data.data);
      }
    } catch (error) {
      console.error('Error fetching sitemap details:', error);
      setError('Failed to fetch sitemap details');
    } finally {
      setIsLoading(false);
    }
  };

  const createSitemap = async () => {
    if (!selectedWebsiteId || !newSitemapName || !newSitemapUrl) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/protected/sitemaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          websiteId: selectedWebsiteId,
          name: newSitemapName,
          description: newSitemapDescription,
          baseUrl: newSitemapUrl
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowNewSitemapForm(false);
        setNewSitemapName('');
        setNewSitemapDescription('');
        setNewSitemapUrl('');
        fetchSitemaps();
      } else {
        setError(data.error || 'Failed to create sitemap');
      }
    } catch (error) {
      console.error('Error creating sitemap:', error);
      setError('Failed to create sitemap');
    } finally {
      setIsLoading(false);
    }
  };

  const crawlSitemap = async (sitemapId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/protected/sitemaps/${sitemapId}/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(crawlSettings)
      });

      const data = await response.json();
      if (data.success) {
        fetchSitemapDetails(sitemapId);
        setError(null);
      } else {
        setError(data.error || 'Failed to crawl sitemap');
      }
    } catch (error) {
      console.error('Error crawling sitemap:', error);
      setError('Failed to crawl sitemap');
    } finally {
      setIsLoading(false);
    }
  };

  const addPage = async () => {
    if (!selectedSitemap || !newPageUrl) {
      setError('Please enter a URL');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/protected/sitemaps/${selectedSitemap.id}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          url: newPageUrl,
          title: newPageTitle,
          description: newPageDescription
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowAddPageForm(false);
        setNewPageUrl('');
        setNewPageTitle('');
        setNewPageDescription('');
        fetchSitemapDetails(selectedSitemap.id);
      } else {
        setError(data.error || 'Failed to add page');
      }
    } catch (error) {
      console.error('Error adding page:', error);
      setError('Failed to add page');
    } finally {
      setIsLoading(false);
    }
  };

  const addSecret = async () => {
    if (!selectedSitemap || !newSecretName || !newSecretKey || !newSecretValue) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/protected/sitemaps/${selectedSitemap.id}/secrets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          name: newSecretName,
          key: newSecretKey,
          value: newSecretValue,
          type: newSecretType,
          description: newSecretDescription
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowAddSecretForm(false);
        setNewSecretName('');
        setNewSecretKey('');
        setNewSecretValue('');
        setNewSecretType('text');
        setNewSecretDescription('');
        fetchSitemapDetails(selectedSitemap.id);
      } else {
        setError(data.error || 'Failed to add secret');
      }
    } catch (error) {
      console.error('Error adding secret:', error);
      setError('Failed to add secret');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSecret = async (secretId: string) => {
    if (!selectedSitemap) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/protected/sitemaps/${selectedSitemap.id}/secrets/${secretId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchSitemapDetails(selectedSitemap.id);
      } else {
        setError(data.error || 'Failed to delete secret');
      }
    } catch (error) {
      console.error('Error deleting secret:', error);
      setError('Failed to delete secret');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedWebsite = selectedProject?.websites.find(w => w.id === selectedWebsiteId);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Project and Website Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Project & Website</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedWebsiteId('');
                setSitemaps([]);
                setSelectedSitemap(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <select
              value={selectedWebsiteId}
              onChange={(e) => {
                setSelectedWebsiteId(e.target.value);
                setSitemaps([]);
                setSelectedSitemap(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedProjectId}
            >
              <option value="">Select a website</option>
              {selectedProject?.websites.map(website => (
                <option key={website.id} value={website.id}>{website.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sitemaps List */}
      {selectedWebsiteId && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Site Maps</h2>
            <button
              onClick={() => setShowNewSitemapForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>New Site Map</span>
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : sitemaps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Map className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No site maps found. Create your first site map to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sitemaps.map(sitemap => (
                <div
                  key={sitemap.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => fetchSitemapDetails(sitemap.id)}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-gray-900">{sitemap.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{sitemap.baseUrl}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{sitemap.pages.length} pages</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      sitemap.status === 'complete' ? 'bg-green-100 text-green-800' :
                      sitemap.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {sitemap.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Sitemap Form */}
      {showNewSitemapForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Site Map</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                value={newSitemapName}
                onChange={(e) => setNewSitemapName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Website Site Map"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base URL *</label>
              <input
                type="url"
                value={newSitemapUrl}
                onChange={(e) => setNewSitemapUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newSitemapDescription}
                onChange={(e) => setNewSitemapDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional description of this site map"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={createSitemap}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Site Map'}
              </button>
              <button
                onClick={() => setShowNewSitemapForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sitemap Details */}
      {selectedSitemap && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedSitemap.name}</h2>
              <p className="text-gray-600">{selectedSitemap.baseUrl}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => crawlSitemap(selectedSitemap.id)}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                <span>Crawl Website</span>
              </button>
            </div>
          </div>

          {/* Crawl Settings */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Crawl Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Pages</label>
                <input
                  type="number"
                  value={crawlSettings.maxPages}
                  onChange={(e) => setCrawlSettings({...crawlSettings, maxPages: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Depth</label>
                <input
                  type="number"
                  value={crawlSettings.maxDepth}
                  onChange={(e) => setCrawlSettings({...crawlSettings, maxDepth: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{selectedSitemap.pages.length}</div>
              <div className="text-sm text-blue-800">Pages Found</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{selectedSitemap.blockedPages.length}</div>
              <div className="text-sm text-yellow-800">Blocked Pages</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{selectedSitemap.inputFields.length}</div>
              <div className="text-sm text-purple-800">Input Fields</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{selectedSitemap.secrets.length}</div>
              <div className="text-sm text-green-800">Secrets</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mb-6">
            <button
              onClick={() => setShowAddPageForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Page</span>
            </button>
            <button
              onClick={() => setShowAddSecretForm(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              <Key className="h-4 w-4" />
              <span>Add Secret</span>
            </button>
          </div>

          {/* Add Page Form */}
          {showAddPageForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Add Manual Page</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                  <input
                    type="url"
                    value={newPageUrl}
                    onChange={(e) => setNewPageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/page"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Page Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newPageDescription}
                    onChange={(e) => setNewPageDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Page Description"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-3">
                <button
                  onClick={addPage}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add Page'}
                </button>
                <button
                  onClick={() => setShowAddPageForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add Secret Form */}
          {showAddSecretForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-3">Add Secret (Login Credentials, etc.)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newSecretName}
                    onChange={(e) => setNewSecretName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Login Username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Key *</label>
                  <input
                    type="text"
                    value={newSecretKey}
                    onChange={(e) => setNewSecretKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="username, email, password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                  <input
                    type={newSecretType === 'password' ? 'password' : 'text'}
                    value={newSecretValue}
                    onChange={(e) => setNewSecretValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Actual value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newSecretType}
                    onChange={(e) => setNewSecretType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="password">Password</option>
                    <option value="email">Email</option>
                    <option value="url">URL</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newSecretDescription}
                  onChange={(e) => setNewSecretDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex space-x-3 mt-3">
                <button
                  onClick={addSecret}
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add Secret'}
                </button>
                <button
                  onClick={() => setShowAddSecretForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Secrets List */}
          {selectedSitemap.secrets.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Secrets</h3>
              <div className="space-y-2">
                {selectedSitemap.secrets.map(secret => (
                  <div key={secret.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{secret.name}</div>
                      <div className="text-sm text-gray-600">
                        {secret.key} • {secret.type} • {secret.description}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSecret(secret.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pages List */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Pages ({selectedSitemap.pages.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedSitemap.pages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {page.title || page.url}
                      </a>
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                      {page.manual && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Manual</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{page.url}</div>
                    {page.description && (
                      <div className="text-sm text-gray-500">{page.description}</div>
                    )}
                    {page.error && (
                      <div className="text-sm text-red-600">Error: {page.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
