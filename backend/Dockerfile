FROM node:18-alpine

WORKDIR /app

# package.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install --production

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 3000

# 환경 변수 설정 (필요한 경우)
ENV NODE_ENV=production
ENV PORT=3000

# 서버 시작
CMD ["node", "server.js"]

