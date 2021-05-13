FROM ccr.ccs.tencentyun.com/doctorwork/node:12.16.1

EXPOSE 80
ENV TIME_ZONE=Asia/Shanghai
ENV APOLLO_URL=http://apollo-configservice
# ENV MONGO_URL=doctorwork_dev:Doctorwork!dev@10.10.99.10:27017/dayoff?authSource=admin
# RUN \
#     mkdir -p /usr/src/app \
#     && apk add --no-cache tzdata \
#     && echo "${TIME_ZONE}" > /etc/timezone \ 
#     && ln -sf /usr/share/zoneinfo/${TIME_ZONE} /etc/localtime

# RUN apk add --no-cache bash

COPY . /app

WORKDIR /app

CMD  ["/bin/bash", "/app/scripts/serve.sh"]
# CMD npm run serve -- --port=80
