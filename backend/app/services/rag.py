from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from app.config import get_settings
from app.services.supabase_service import get_supabase, get_conversation_messages
import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Tu es le 'Concierge Bobotcho', assistant IA d'élite pour une marque ivoirienne de luxe accessible.
Ton ton est 'Abidjan Premium' : poli, chaleureux, expert et utilisant le vouvoiement.

### RÈGLES D'OR:
1. Sois bref, élégant et mentionne les quartiers d'Abidjan pour créer de la proximité.
2. Priorise toujours la vente du bundle avec installation (70 000 FCFA).
3. Si pas d'information pertinente, propose qu'on vérifie et qu'on rappelle.
4. N'invente jamais de caractéristiques techniques ou de prix.
5. Utilise TOUJOURS le vouvoiement (Monsieur/Madame).
6. Réponds en français.

### CONTEXTE PRODUIT:
- Bobotcho : système de lavage à l'eau intégré pour WC classiques
- Prix standard : 100 000 FCFA (seul) / 120 000 FCFA (avec installation)
- OFFRE WHATSAPP : 60 000 FCFA (seul) / 70 000 FCFA (avec installation)
- Fonctionne SANS électricité
- Livraison 24-48h à Abidjan
- Paiement à la livraison (COD), Wave, Orange Money, MTN

### INFORMATIONS CONTEXTUELLES:
{context}

### HISTORIQUE DE CONVERSATION:
{chat_history}

Réponds à la question du client de manière concise et professionnelle."""


def _get_embeddings() -> OpenAIEmbeddings:
    """Get OpenAI embeddings model."""
    settings = get_settings()
    return OpenAIEmbeddings(
        model=settings.embedding_model,
        openai_api_key=settings.openai_api_key,
    )


def _get_llm() -> ChatOpenAI:
    """Get OpenRouter LLM via OpenAI-compatible API."""
    settings = get_settings()
    return ChatOpenAI(
        model=settings.llm_model,
        openai_api_key=settings.openrouter_api_key,
        openai_api_base="https://openrouter.ai/api/v1",
        temperature=0.7,
        max_tokens=500,
    )


def _get_vector_store() -> SupabaseVectorStore:
    """Get Supabase vector store for RAG retrieval."""
    client = get_supabase()
    embeddings = _get_embeddings()
    return SupabaseVectorStore(
        client=client,
        embedding=embeddings,
        table_name="knowledge_base",
        query_name="match_documents",
    )


async def generate_ai_response(message: str, conversation_id: str) -> str:
    """Generate an AI response using RAG (retrieve + generate).

    1. Retrieve relevant documents from Supabase pgvector
    2. Load conversation history
    3. Generate response with OpenRouter LLM
    """
    try:
        # 1. Retrieve relevant context
        vector_store = _get_vector_store()
        retriever = vector_store.as_retriever(search_kwargs={"k": get_settings().rag_top_k})
        docs = retriever.invoke(message)
        context = "\n\n".join([doc.page_content for doc in docs])

        if not context.strip():
            context = "Aucune information spécifique trouvée dans la base de connaissances."

        # 2. Load conversation history
        history_messages = await get_conversation_messages(
            conversation_id,
            limit=get_settings().max_conversation_history,
        )

        chat_history = ""
        for msg in history_messages:
            role_label = "Client" if msg["role"] == "customer" else "Concierge"
            chat_history += f"{role_label}: {msg['content']}\n"

        # 3. Generate response
        llm = _get_llm()

        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(SYSTEM_PROMPT),
            HumanMessagePromptTemplate.from_template("{question}"),
        ])

        chain = prompt | llm
        result = chain.invoke({
            "context": context,
            "chat_history": chat_history,
            "question": message,
        })

        response_text = result.content.strip()
        logger.info(f"RAG response generated for conversation {conversation_id} ({len(docs)} docs retrieved)")
        return response_text

    except Exception as e:
        logger.error(f"RAG generation failed: {e}", exc_info=True)
        return "Merci pour votre message. Nos conseillers Bobotcho sont actuellement indisponibles, mais nous traiterons votre demande en priorité dès demain matin à 8h. Merci de votre patience !"
