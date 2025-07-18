import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Share2, 
  Star, 
  MoreVertical,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered
} from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Separator } from '../components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'

interface DocumentData {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  is_starred: boolean
}

export default function DocumentEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const loadDocument = async (userId: string) => {
      try {
        const doc = await blink.db.documents.list({
          where: { id, user_id: userId }
        })
        if (doc.length > 0) {
          const documentData = doc[0]
          setDocumentData(documentData)
          setTitle(documentData.title)
          setContent(documentData.content)
          if (contentRef.current) {
            contentRef.current.innerHTML = documentData.content
          }
        }
      } catch (error) {
        console.error('Failed to load document:', error)
      } finally {
        setLoading(false)
      }
    }

    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      if (state.user && !state.isLoading && id) {
        loadDocument(state.user.id)
      }
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [id])

  const saveDocument = async () => {
    if (!documentData || !user) return
    
    setSaving(true)
    try {
      await blink.db.documents.update(documentData.id, {
        title,
        content,
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to save document:', error)
    } finally {
      setSaving(false)
    }
  }

  const debouncedSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(saveDocument, 1000)
  }

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    debouncedSave()
  }

  const handleContentChange = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerHTML
      setContent(newContent)
      debouncedSave()
    }
  }

  const formatText = (command: string, value?: string) => {
    window.document.execCommand(command, false, value)
    contentRef.current?.focus()
    handleContentChange()
  }

  const toggleStar = async () => {
    if (!documentData) return
    try {
      const newStarred = !documentData.is_starred
      await blink.db.documents.update(documentData.id, { is_starred: newStarred })
      setDocumentData({ ...documentData, is_starred: newStarred })
    } catch (error) {
      console.error('Failed to toggle star:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document not found</h2>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex flex-col">
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg font-medium border-0 p-0 h-auto focus:ring-0 focus:border-0"
                placeholder="Untitled document"
              />
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Last edit was {saving ? 'saving...' : 'saved'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={toggleStar}>
              <Star 
                className={`w-4 h-4 ${documentData.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} 
              />
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Download as PDF</DropdownMenuItem>
                <DropdownMenuItem>Download as Word</DropdownMenuItem>
                <DropdownMenuItem>Version history</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b border-gray-200 px-6 py-2">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('bold')}
            className="h-8 w-8 p-0"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('italic')}
            className="h-8 w-8 p-0"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('underline')}
            className="h-8 w-8 p-0"
          >
            <Underline className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyLeft')}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyCenter')}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('justifyRight')}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertUnorderedList')}
            className="h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText('insertOrderedList')}
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          className="min-h-[600px] outline-none text-gray-900 leading-relaxed"
          style={{
            fontSize: '16px',
            lineHeight: '1.6',
            fontFamily: 'Google Sans, Roboto, sans-serif'
          }}
          placeholder="Start writing..."
        />
      </main>
    </div>
  )
}