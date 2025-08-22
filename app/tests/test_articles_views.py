from app import db
from app.models import Article, City, Speciality, EducationForm, AdmissionYear


def seed_articles(app):
    with app.app_context():
        sp = Speciality.query.first()
        ef = EducationForm.query.first()
        year = AdmissionYear.query.first()
        city = City.query.first()
        # common
        a1 = Article(title='Common', content='x', is_published=True, audience='all')
        # city
        a2 = Article(title='City', content='x', is_published=True, audience='city', audience_city_id=city.id)
        # study (year)
        a3 = Article(title='Year', content='x', is_published=True, audience=None, audience_admission_year_id=year.id, speciality_id=sp.id, education_form_id=ef.id)
        db.session.add_all([a1,a2,a3])
        db.session.commit()


def test_views_common_and_city(client, app):
    seed_articles(app)
    # common
    rv = client.get('/api/articles?view=common')
    assert rv.status_code == 200
    data = rv.get_json()
    titles = [a['title'] for a in data['articles']]
    assert 'Common' in titles
    assert 'City' not in titles
    # city
    rv = client.get('/api/articles?view=city')
    assert rv.status_code == 200
    data = rv.get_json()
    titles = [a['title'] for a in data['articles']]
    assert 'City' in titles


def test_array_filters(client, app):
    seed_articles(app)
    # By year array
    rv = client.get('/api/articles?admission_year_ids=1')
    assert rv.status_code == 200
    data = rv.get_json()
    titles = [a['title'] for a in data['articles']]
    assert 'Year' in titles


