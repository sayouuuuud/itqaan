export interface EditorContentDB {
  id: number;
  userId: number;
  title: string;
  content: string;
  fontFamily: string;
  contentType: 'sermon' | 'article' | 'other';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveContentRequest {
  userId: number;
  title: string;
  content: string;
  fontFamily: string;
  contentType: 'sermon' | 'article' | 'other';
  contentId?: number;
}

export async function saveEditorContent(data: SaveContentRequest) {
  try {
    const response = await fetch('/api/editor/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error saving content:', error);
    throw error;
  }
}

export async function getEditorContent(contentId: number) {
  try {
    const response = await fetch(`/api/editor/content/${contentId}`);

    if (!response.ok) {
      throw new Error(`Load failed: ${response.statusText}`);
    }

    const result: EditorContentDB = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error loading content:', error);
    throw error;
  }
}

export async function getUserDefaultFont(userId: number): Promise<string> {
  try {
    const response = await fetch(`/api/user/preferences/${userId}`);

    if (!response.ok) {
      return 'Cairo';
    }

    const result = await response.json();
    return result.defaultFont || 'Cairo';
  } catch (error) {
    console.error('⚠️ Error loading user preferences:', error);
    return 'Cairo';
  }
}

export async function saveUserPreferences(userId: number, defaultFont: string) {
  try {
    const response = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        defaultFont,
      }),
    });

    if (!response.ok) {
      throw new Error(`Save preferences failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error saving preferences:', error);
    throw error;
  }
}

export async function listUserContent(userId: number) {
  try {
    const response = await fetch(`/api/editor/user/${userId}/content`);

    if (!response.ok) {
      throw new Error(`List failed: ${response.statusText}`);
    }

    const result: EditorContentDB[] = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error listing content:', error);
    throw error;
  }
}
