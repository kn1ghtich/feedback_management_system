const request = require('supertest');
const app = require('../app');
const Post = require('../models/Post');

jest.mock('../models/Post');

describe('Тестирование PUT /edit/:id', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Когда пост успешно обновлён', async () => {
        const mockPost = {
            _id: 'abc123',
            title: 'Обновлённый заголовок',
            text: 'Обновлённый текст',
            image: 'path_to_image.jpg',
        };

        Post.findByIdAndUpdate.mockResolvedValue(mockPost);

        const res = await request(app)
            .put('/edit/abc123')
            .send({ title: 'Обновлённый заголовок', text: 'Обновлённый текст' }); // Отправляем запрос

        expect(res.status).toBe(200);

        expect(res.body).toEqual(mockPost);

        expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(
            'abc123',
            { title: 'Обновлённый заголовок', text: 'Обновлённый текст', image: undefined },
            { new: true }
        );
    });

    it('Когда пост не найден', async () => {
        Post.findByIdAndUpdate.mockResolvedValue(null);

        const res = await request(app)
            .put('/edit/invalid-id')
            .send({ title: 'Заголовок', text: 'Текст' });


        expect(res.status).toBe(404);


        expect(res.text).toBe('Post not found');
    });

    it('Когда возникает ошибка на сервере', async () => {
        Post.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

        const res = await request(app)
            .put('/edit/abc123')
            .send({ title: 'Заголовок', text: 'Текст' });

        expect(res.status).toBe(500);

        expect(res.text).toBe('Database error');
    });
});