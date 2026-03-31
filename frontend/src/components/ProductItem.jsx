const API_HOST = 'http://localhost:3001';

export default function ProductItem({ product, onEdit, onDelete }) {
  if (!product) return <div>Ошибка загрузки товара</div>;

  const imageSrc = product.image
    ? product.image.startsWith('http')
      ? product.image
      : product.image.startsWith('/uploads/')
        ? `${API_HOST}${product.image}`
        : product.image
    : '';

  return (
    <div className="menu-card">
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={product.title}
          className="product-image"
        />
      ) : (
        <div className="product-image product-image--placeholder">
          Нет фото
        </div>
      )}

      <h3>{product.title}</h3>
      <p><strong>Категория:</strong> {product.category}</p>
      <p>{product.description}</p>
      <p><strong>Цена:</strong> {product.price} ₽</p>
      <p><strong>Остаток:</strong> {product.stock} шт.</p>

      <div className="menu-card__actions">
        <button className="btn edit" onClick={() => onEdit(product)}>
          Редактировать
        </button>
        <button className="btn delete" onClick={() => onDelete(product.id)}>
          Удалить
        </button>
      </div>
    </div>
  );
}


