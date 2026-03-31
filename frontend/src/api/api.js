const BASE_URL = '/api/products';

export const getProducts = async () => {
  const res = await fetch(BASE_URL);
  if (!res.ok) {
    throw new Error(`Ошибка загрузки: ${res.status}`);
  }
  return res.json();
};

export const deleteProduct = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE'
  });

  if (res.status === 204 || res.ok) {
    return true;
  }

  throw new Error(`Удаление не удалось: ${res.status}`);
};

