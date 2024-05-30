document.getElementById('searchInput').addEventListener('input', updateProducts);

//priceValue
async function updateProducts() {
  try {
    const name = document.getElementById('searchInput').value;

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      const products = await response.json();
      const container = document.getElementById('productsList');
      container.innerHTML = '';
      products.forEach(product => {
        const productElement = `
            <div>
              <p><strong>${product.name}</strong></p>
              <p>${product.description}</p>
              <p>$${product.price}</p>
              <p>${product.stock} available</p>
        `;
        container.innerHTML += productElement;
      });
    } else {
      console.error('Response not ok with status:', response.status);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

updateProducts();