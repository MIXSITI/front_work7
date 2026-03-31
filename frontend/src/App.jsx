import { useState, useEffect } from 'react';
import ProductList from './components/ProductList';
import ProductModal from './components/ProductModal';
import { getProducts, deleteProduct } from './api/api';
import './styles/main.scss';

function App() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('все');

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Не удалось загрузить меню кофейни');
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'все') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const openModal = (product = null) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить позицию из меню?')) return;

    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Ошибка удаления:', err);
      alert('Не удалось удалить позицию');
    }
  };

  const categories = ['все', 'Напитки', 'Выпечка', 'Десерты'];

  return (
    <div className="app">
      <header>
        <h1>MIX Coffee</h1>
      </header>

      <div className="add-button-container">
        <button className="btn btn-add" onClick={() => openModal()}>
          + Добавить позицию в меню
        </button>
      </div>

      <div className="controls">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Поиск по названию или описанию..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <ProductList
        products={filteredProducts}
        onEdit={openModal}
        onDelete={handleDelete}
      />

      <ProductModal
        open={modalOpen}
        product={editingProduct}
        onClose={closeModal}
        onSave={loadProducts}
      />
    </div>
  );
}

export default App;

