from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
import os

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)  # Enable CORS for frontend communication

# Set up API Key
os.environ["GOOGLE_API_KEY"] = "your google api key"

# Initialize LLM
# model = ChatGoogleGenerativeAI(model="gemini-2.0-flash-lite-preview-02-05")
model = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

# Load Embeddings & Vector DB
model_name = "sentence-transformers/all-MiniLM-L6-v2"
# model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
embeddings = HuggingFaceEmbeddings(model_name=model_name)
vectorDB_FilePath = "Faiss_index"


def create_vector_db():
    loader = CSVLoader(file_path='pos system QA.csv', source_column='prompt')
    docs = loader.load()
    vectorDB = FAISS.from_documents(documents=docs, embedding=embeddings)
    vectorDB.save_local(vectorDB_FilePath)

if not os.path.exists(vectorDB_FilePath):
    print("Creating FAISS index...")
    create_vector_db()
    print("FAISS index created successfully!")
else:
    print("FAISS index already exists.")

def get_qa_chain():
    vectorDB = FAISS.load_local(vectorDB_FilePath, embeddings, allow_dangerous_deserialization=True)
    retriever = vectorDB.as_retriever(score_threshold=0.7)

    # template = """Given the following context and a question, generate an answer based on this context only.
    # In the answer try to provide as much text as possible from "response" section in the source document context without making much changes.
    # If the answer is not found in the context, kindly state "I am sorry, but i don't understand your question." Don't try to make up an answer.

    # CONTEXT: {context}

    # QUESTION: {question}"""
    
    # prompt = PromptTemplate(
    #     input_variables=["context", "question"],
    #     template=template
    # )
    
    # chain_type_kwargs = {"prompt": prompt}
    
    chain = RetrievalQA.from_chain_type(
        llm=model,
        chain_type="stuff",
        retriever=retriever,
        input_key="query",
        return_source_documents=True,
        # chain_type_kwargs=chain_type_kwargs
    )
    return chain

# Initialize chatbot
qa_chain = get_qa_chain()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_query = data.get("message", "")
    
    if not user_query:
        return jsonify({"response": "Please enter a valid query."})
    
    ai_response = qa_chain.invoke({"query": user_query})
    
    return jsonify({"response": ai_response['result']})

# Run the application
if __name__ == "__main__":
    app.run(host="192.168.1.42", port=5000, debug=True)