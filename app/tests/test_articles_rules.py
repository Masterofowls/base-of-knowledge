from app.models import Article
from app import db


def test_create_article_for_all(client, auth_header):
    payload = {
        'title': 'Для всех',
        'content': '<p>all</p>',
        'is_published': True,
        'publish_scope': { 'publish_for_all': True }
    }
    rv = client.post('/api/articles/', json=payload, headers=auth_header)
    assert rv.status_code == 201
    data = rv.get_json()
    assert data.get('id')


def test_create_articles_by_rules(client, auth_header, app):
    rules = [{
        'education_form_ids': [1],
        'speciality_ids': [1],
        'city_ids': [1],
        'admission_year_ids': [1],
    }, {
        'education_form_ids': [2],
        'speciality_ids': [1],
        'city_ids': [2],
        'admission_year_ids': [2],
    }]
    payload = {
        'title': 'Правила',
        'content': '<p>rules</p>',
        'is_published': True,
        'publish_scope': { 'rules': rules }
    }
    rv = client.post('/api/articles/', json=payload, headers=auth_header)
    assert rv.status_code == 201
    data = rv.get_json()
    assert data.get('ids') and len(data['ids']) == 2

    with app.app_context():
        count = db.session.query(Article).filter(Article.title == 'Правила').count()
        assert count == 2


def test_filter_by_arrays(client):
    # Should not error and return JSON
    rv = client.get('/api/articles?education_form_ids=1&education_form_ids=2&city_ids=1')
    assert rv.status_code == 200
    data = rv.get_json()
    assert 'articles' in data


