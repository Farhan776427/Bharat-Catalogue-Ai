// ⚠️ IMPORTANT: Apni Gemini API Key Yahan Paste Karo
const GEMINI_API_KEY = "AQ.Ab8RN6J6FCcy1jo390-wJJaNzVPBk1Z5ItPqhyDxc4cTll8s9A"; // <-- Yahan apni key dalo

let uploadedPhotos = [];
let currentProduct = {};
let products = JSON.parse(localStorage.getItem('products')) || [];
let shopProfile = JSON.parse(localStorage.getItem('shopProfile')) || {};

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadShopProfile();
});

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    uploadedPhotos = [file];
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = `<img src="${e.target.result}" class="w-full max-w-xs rounded-lg shadow">`;
        processWithAI(e.target.result);
    };
    reader.readAsDataURL(file);
}

async function processWithAI(imageBase64) {
    document.getElementById('aiProcessing').classList.remove('hidden');
    document.getElementById('aiResult').classList.add('hidden');
    
    try {
        // Gemini API Call
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Is image ko analyze karo aur ek e-commerce product listing banao. 
                        Response JSON format mein do:
                        {
                            "title": "Product ka naam",
                            "category": "Category (Kapde/Electronics/Kirana/Hardware/Footwear)",
                            "description": "2-3 lines mein product description"
                        }
                        Sirf JSON do, kuch aur nahi.`
                    }, {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: imageBase64.split(',')[1]
                        }
                    }]
                }]
            })
        });
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0]) {
            const aiText = data.candidates[0].content.parts[0].text;
            
            // Extract JSON from response
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                displayAIResult({
                    title: result.title || "Product",
                    category: result.category || "General",
                    description: result.description || "Quality product",
                    studioImage: imageBase64
                });
            } else {
                throw new Error("Invalid AI response");
            }
        } else {
            throw new Error("API error");
        }
        
    } catch (error) {
        console.error(error);
        alert("AI processing mein error aaya. Check karo API key sahi hai ya nahi.");
        document.getElementById('aiProcessing').classList.add('hidden');
    }
}

function displayAIResult(result) {
    document.getElementById('aiProcessing').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    document.getElementById('studioImage').src = result.studioImage;
    document.getElementById('productTitle').value = result.title;
    document.getElementById('productCategory').value = result.category;
    document.getElementById('productDescription').value = result.description;
    
    currentProduct = result;
}

function saveProduct() {
    const wholesalePrice = document.getElementById('wholesalePrice').value;
    const retailPrice = document.getElementById('retailPrice').value;
    
    if (!wholesalePrice && !retailPrice) {
        alert('कृपया कम से कम एक मूल्य डालें');
        return;
    }
    
    const product = {
        id: Date.now(),
        title: document.getElementById('productTitle').value,
        category: document.getElementById('productCategory').value,
        description: document.getElementById('productDescription').value,
        image: document.getElementById('studioImage').src,
        wholesalePrice: wholesalePrice ? parseInt(wholesalePrice) : null,
        retailPrice: retailPrice ? parseInt(retailPrice) : null,
        createdAt: new Date().toISOString()
    };
    
    products.push(product);
    localStorage.setItem('products', JSON.stringify(products));
    
    document.getElementById('aiResult').classList.add('hidden');
    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('wholesalePrice').value = '';
    document.getElementById('retailPrice').value = '';
    
    loadProducts();
    alert('✅ प्रोडक्ट सेव हो गया!');
}

function loadProducts() {
    const list = document.getElementById('productsList');
    const noProducts = document.getElementById('noProducts');
    document.getElementById('productCount').textContent = products.length;
    
    if (products.length === 0) {
        list.innerHTML = '';
        noProducts.classList.remove('hidden');
        return;
    }
    
    noProducts.classList.add('hidden');
    list.innerHTML = products.map(p => `
        <div class="bg-gray-50 rounded-lg shadow p-2">
            <img src="${p.image}" class="w-full h-24 object-cover rounded mb-2">
            <h3 class="font-semibold text-xs">${p.title}</h3>
            <p class="text-xs text-gray-600">${p.category}</p>
            <div class="mt-1 space-y-1">
                ${p.wholesalePrice ? `<p class="text-xs text-blue-600">थोक: ₹${p.wholesalePrice}</p>` : ''}
                ${p.retailPrice ? `<p class="text-xs text-green-600">खुदरा: ₹${p.retailPrice}</p>` : ''}
            </div>
            <button onclick="deleteProduct(${p.id})" class="mt-2 w-full bg-red-100 text-red-600 text-xs py-1 rounded">
                <i class="fas fa-trash"></i> हटाएं
            </button>
        </div>
    `).join('');
}

function deleteProduct(id) {
    if (confirm('हटाना है?')) {
        products = products.filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
    }
}

function shareOnWhatsApp() {
    if (products.length === 0) {
        alert('पहले प्रोडक्ट जोड़ें');
        return;
    }
    
    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '') + 'catalogue.html';
    const shopData = btoa(JSON.stringify(shopProfile));
    const productsData = btoa(JSON.stringify(products));
    const link = `${baseUrl}?shop=${shopData}&products=${productsData}`;
    
    const message = `🏪 *${shopProfile.shopName || 'मेरी दुकान'}* का कैटलॉग:\n\n${link}\n\n📞 ${shopProfile.phone || 'N/A'}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

function showShopProfile() {
    document.getElementById('shopProfileModal').classList.remove('hidden');
    document.getElementById('shopNameInput').value = shopProfile.shopName || '';
    document.getElementById('shopPhoneInput').value = shopProfile.phone || '';
}

function closeShopProfile() {
    document.getElementById('shopProfileModal').classList.add('hidden');
}

function saveShopProfile() {
    shopProfile = {
        shopName: document.getElementById('shopNameInput').value,
        phone: document.getElementById('shopPhoneInput').value
    };
    localStorage.setItem('shopProfile', JSON.stringify(shopProfile));
    loadShopProfile();
    closeShopProfile();
    alert('✅ सेव हो गया!');
}

function loadShopProfile() {
    if (shopProfile.shopName) {
        document.getElementById('shopBanner').classList.remove('hidden');
        document.getElementById('shopName').textContent = shopProfile.shopName;
        document.getElementById('shopPhone').textContent = `📞 ${shopProfile.phone || 'N/A'}`;
    }
}
