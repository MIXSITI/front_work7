const express = require('express');
const { nanoid } = require('nanoid');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;
const SALT_ROUNDS = 10;

const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${nanoid(10)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Только изображения разрешены'));
    }
    cb(null, true);
  }
});

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${res.statusCode} ${req.originalUrl}`);
  });
  next();
});

let users = [];
let products = [
  {
    id: nanoid(6),
    title: 'Капучино',
    category: 'Напитки',
    description: 'Классический капучино с нежной пенкой',
    price: 320,
    stock: 20,
    image: '/images/kapuchino.jpg'
  },
  {
    id: nanoid(6),
    title: 'Латте',
    category: 'Напитки',
    description: 'Нежный латте с бархатистой пенкой',
    price: 350,
    stock: 15,
    image: '/images/latte.jpg'
  },
  {
    id: nanoid(6),
    title: 'Эспрессо',
    category: 'Напитки',
    description: 'Крепкий эспрессо двойной порции',
    price: 250,
    stock: 30,
    image: '/images/aspreso.jpg'
  },
  {
    id: nanoid(6),
    title: 'Раф',
    category: 'Напитки',
    description: 'Раф кофейный с ванилью',
    price: 370,
    stock: 12,
    image: '/images/raf.jpg'
  },
  {
    id: nanoid(6),
    title: 'Круассан',
    category: 'Выпечка',
    description: 'Хрустящий французский круассан',
    price: 180,
    stock: 18,
    image: '/images/kruasan.jpg'
  },
  {
    id: nanoid(6),
    title: 'Чизкейк',
    category: 'Десерты',
    description: 'Нью-йоркский чизкейк классический',
    price: 450,
    stock: 8,
    image: '/images/chiskeyk.jpg'
  }
];

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Practice 7 API',
      version: '1.0.0',
      description: 'API для авторизации и управления товарами'
    },
    servers: [{ url: `http://localhost:${port}` }]
  },
  apis: [`${__filename}`]
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name
  };
}

async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function findUserByEmail(email) {
  return users.find((user) => user.email === email);
}

function findProductById(id) {
  return products.find((product) => product.id === id);
}

function deleteUploadedImage(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) {
    return;
  }

  const fullImagePath = path.join(__dirname, 'public', imagePath.replace(/^\//, ''));
  if (fs.existsSync(fullImagePath)) {
    fs.unlinkSync(fullImagePath);
  }
}

function buildProductPayload(body, imagePath) {
  const title = normalizeString(body.title);
  const category = normalizeString(body.category);
  const description = normalizeString(body.description);
  const price = Number(body.price);
  const stock = body.stock !== undefined ? Number(body.stock) : 0;

  if (!title || !category || !description) {
    return { error: 'title, category and description are required' };
  }

  if (Number.isNaN(price) || price <= 0) {
    return { error: 'price must be a positive number' };
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return { error: 'stock must be a non-negative integer' };
  }

  return {
    payload: {
      title,
      category,
      description,
      price,
      stock,
      image: imagePath
    }
  };
}

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: ivan@example.com
 *         first_name:
 *           type: string
 *           example: Иван
 *         last_name:
 *           type: string
 *           example: Иванов
 *         password:
 *           type: string
 *           example: qwerty123
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           example: ivan@example.com
 *         password:
 *           type: string
 *           example: qwerty123
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *     Product:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           example: abc123
 *         title:
 *           type: string
 *           example: Капучино
 *         category:
 *           type: string
 *           example: Напитки
 *         description:
 *           type: string
 *           example: Классический капучино
 *         price:
 *           type: number
 *           example: 320
 *         stock:
 *           type: integer
 *           example: 20
 *         image:
 *           type: string
 *           example: /uploads/image.jpg
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Некорректные данные
 *       409:
 *         description: Пользователь уже существует
 */
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const email = normalizeString(req.body.email).toLowerCase();
    const firstName = normalizeString(req.body.first_name);
    const lastName = normalizeString(req.body.last_name);
    const password = normalizeString(req.body.password);

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ error: 'email, first_name, last_name and password are required' });
    }

    if (findUserByEmail(email)) {
      return res.status(409).json({ error: 'user already exists' });
    }

    const newUser = {
      id: nanoid(8),
      email,
      first_name: firstName,
      last_name: lastName,
      password: await hashPassword(password)
    };

    users.push(newUser);
    res.status(201).json(sanitizeUser(newUser));
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *       400:
 *         description: Некорректные данные
 *       401:
 *         description: Неверный пароль
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = normalizeString(req.body.email).toLowerCase();
    const password = normalizeString(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'user not found' });
    }

    const isAuthenticated = await verifyPassword(password, user.password);
    if (!isAuthenticated) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    res.json({ login: true, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
  res.json(products);
});

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по id
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар найден
 *       404:
 *         description: Товар не найден
 */
app.get('/api/products/:id', (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'product not found' });
  }

  res.json(product);
});

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags:
 *       - Products
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Некорректные данные
 */
app.post('/api/products', upload.single('image'), (req, res) => {
  const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;
  const result = buildProductPayload(req.body, imagePath);

  if (result.error) {
    deleteUploadedImage(imagePath);
    return res.status(400).json({ error: result.error });
  }

  const newProduct = {
    id: nanoid(6),
    ...result.payload
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @openapi
 * /api/products/{id}:
 *   put:
 *     summary: Обновить параметры товара
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Товар обновлён
 *       400:
 *         description: Некорректные данные
 *       404:
 *         description: Товар не найден
 */
app.put('/api/products/:id', upload.single('image'), (req, res) => {
  const product = findProductById(req.params.id);
  if (!product) {
    if (req.file) {
      deleteUploadedImage(`/uploads/${req.file.filename}`);
    }
    return res.status(404).json({ error: 'product not found' });
  }

  const imagePath = req.file ? `/uploads/${req.file.filename}` : product.image;
  const result = buildProductPayload(req.body, imagePath);

  if (result.error) {
    if (req.file) {
      deleteUploadedImage(imagePath);
    }
    return res.status(400).json({ error: result.error });
  }

  if (req.file && product.image !== imagePath) {
    deleteUploadedImage(product.image);
  }

  Object.assign(product, result.payload);
  res.json(product);
});

/**
 * @openapi
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Товар удалён
 *       404:
 *         description: Товар не найден
 */
app.delete('/api/products/:id', (req, res) => {
  const index = products.findIndex((product) => product.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'product not found' });
  }

  deleteUploadedImage(products[index].image);
  products.splice(index, 1);
  res.status(204).send();
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err.message === 'Только изображения разрешены') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Сервер запущен: http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api-docs`);
});
