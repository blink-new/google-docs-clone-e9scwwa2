import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, FileText, MoreVertical, Star, Folder } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'

interface Document {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  is_starred: boolean
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadDocuments = async (userId: string) => {
      try {
        const docs = await blink.db.documents.list({
          where: { user_id: userId },
          orderBy: { updated_at: 'desc' }
        })
        setDocuments(docs)
      } catch (error) {
        console.error('Failed to load documents:', error)
      }
    }

    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user && !state.isLoading) {
        loadDocuments(state.user.id)
      }
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const createNewDocument = async () => {
    try {
      const newDoc = await blink.db.documents.create({
        title: 'Untitled document',
        content: '',
        user_id: user?.id,
        is_starred: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      navigate(`/document/${newDoc.id}`)
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  const toggleStar = async (docId: string, currentStarred: boolean) => {
    try {
      await blink.db.documents.update(docId, { is_starred: !currentStarred })
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === docId ? { ...doc, is_starred: !currentStarred } : doc
        )
      )
    } catch (error) {
      console.error('Failed to toggle star:', error)
    }
  }

  const deleteDocument = async (docId: string) => {
    try {
      await blink.db.documents.delete(docId)
      setDocuments(docs => docs.filter(doc => doc.id !== docId))
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const recentDocuments = filteredDocuments.slice(0, 6)
  const starredDocuments = filteredDocuments.filter(doc => doc.is_starred)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Docs</h1>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-96 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Create New Document */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Start a new document</h2>
          <div className="flex space-x-4">
            <Card 
              className="w-32 h-40 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-600"
              onClick={createNewDocument}
            >
              <Plus className="w-12 h-12 text-blue-600 mb-2" />
              <span className="text-sm text-gray-600">Blank</span>
            </Card>
          </div>
        </div>

        {/* Recent Documents */}
        {recentDocuments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent documents</h2>
            <div className="space-y-2">
              {recentDocuments.map((doc) => (
                <Card 
                  key={doc.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/document/${doc.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{doc.title}</h3>
                        <p className="text-sm text-gray-500">
                          Opened {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStar(doc.id, doc.is_starred)
                        }}
                      >
                        <Star 
                          className={`w-4 h-4 ${doc.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} 
                        />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => deleteDocument(doc.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Starred Documents */}
        {starredDocuments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Starred</h2>
            <div className="space-y-2">
              {starredDocuments.map((doc) => (
                <Card 
                  key={doc.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/document/${doc.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{doc.title}</h3>
                        <p className="text-sm text-gray-500">
                          Opened {new Date(doc.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStar(doc.id, doc.is_starred)
                        }}
                      >
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => deleteDocument(doc.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6">Create your first document to get started</p>
            <Button onClick={createNewDocument} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Document
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}