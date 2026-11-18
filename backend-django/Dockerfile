FROM python:3.15-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd -m app && chown -R app /app
USER app
EXPOSE 8000
# 시작 시 마이그레이션과 (비어 있을 때만) 샘플 데이터를 넣고 gunicorn 으로 띄운다.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2"]
