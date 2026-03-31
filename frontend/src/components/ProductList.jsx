import ProductItem from './ProductItem';

export default function ProductList({ products, onEdit, onDelete }) {
  if (!products.length) {
    return <p className="empty-text">Товары не найдены</p>;
  }

  return (
    <div className="product-grid">
      {products.map(product => (
        <ProductItem
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

