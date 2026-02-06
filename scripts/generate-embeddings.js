/**
 * Script pour générer les embeddings de la Knowledge Base Bobotcho
 * et les insérer dans Supabase pour le système RAG
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hoocwfwgdcxuseksjeho.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Parser le document knowledge base
 */
function parseKnowledgeBase(content) {
  const documents = [];
  const sections = content.split('\n---\n');
  
  for (const section of sections) {
    const lines = section.trim().split('\n');
    let currentDoc = {};
    let contentLines = [];
    let inContent = false;
    
    for (const line of lines) {
      if (line.startsWith('**Title**:')) {
        currentDoc.title = line.replace('**Title**:', '').trim();
      } else if (line.startsWith('**Category**:')) {
        currentDoc.category = line.replace('**Category**:', '').trim();
      } else if (line.startsWith('**Priority**:')) {
        currentDoc.priority = parseInt(line.replace('**Priority**:', '').trim());
      } else if (line.startsWith('**Content**')) {
        inContent = true;
      } else if (inContent) {
        contentLines.push(line);
      } else if (line.startsWith('**Metadata**:')) {
        currentDoc.metadata = JSON.parse(line.replace('**Metadata**:', '').trim());
      }
    }
    
    if (currentDoc.title && currentDoc.content) {
      currentDoc.content = contentLines.join('\n').trim();
      documents.push(currentDoc);
    }
  }
  
  return documents;
}

/**
 * Générer les embeddings avec OpenAI
 */
async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });
  
  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Insérer un document dans Supabase
 */
async function insertDocument(doc, embedding) {
  const { data, error } = await supabase
    .from('knowledge_base')
    .insert({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      priority: doc.priority,
      metadata: doc.metadata,
      embedding: embedding
    })
    .select();
  
  if (error) {
    console.error(`❌ Erreur insertion "${doc.title}":`, error.message);
    return null;
  }
  
  console.log(`✅ Document inséré: "${doc.title}"`);
  return data[0];
}

/**
 * Script principal
 */
async function main() {
  console.log('🚀 Génération des embeddings Bobotcho...\n');
  
  // Vérifier les variables d'environnement
  if (!OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY non définie');
    process.exit(1);
  }
  
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY non définie');
    process.exit(1);
  }
  
  // Lire le document knowledge base
  const kbPath = path.join(__dirname, '../docs/knowledge-base-seed-bobotcho.md');
  const kbContent = fs.readFileSync(kbPath, 'utf-8');
  
  // Parser les documents
  const documents = parseKnowledgeBase(kbContent);
  console.log(`📄 ${documents.length} documents trouvés\n`);
  
  // Générer les embeddings et insérer
  for (const doc of documents) {
    try {
      console.log(`🔄 Génération embedding pour: "${doc.title}"`);
      const embedding = await generateEmbedding(doc.content);
      await insertDocument(doc, embedding);
    } catch (error) {
      console.error(`❌ Erreur pour "${doc.title}":`, error.message);
    }
  }
  
  console.log('\n✅ Terminé ! Tous les documents sont dans Supabase avec embeddings.');
}

main().catch(console.error);
