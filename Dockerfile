FROM node:16-alpine
WORKDIR /client
ENV NODE_OPTIONS=--max_old_space_size=4096
COPY package.json ./
COPY package-lock.json ./
RUN npm i
COPY . ./
EXPOSE 3000
CMD ["npm", "start"]