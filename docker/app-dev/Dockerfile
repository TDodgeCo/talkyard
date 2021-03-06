FROM openjdk:8u92-jdk-alpine

RUN apk add --no-cache \
  # Required:
  # (git needed so can include Git revision in the build, and show at http://server/-/build-info.)
  curl unzip git \
  # Nice to have: (why telnet not found?)
  tree less wget net-tools bash

ENV ACVERSION 1.3.12
ENV ACTIVATOR activator-$ACVERSION

RUN \
  curl https://downloads.typesafe.com/typesafe-activator/$ACVERSION/typesafe-$ACTIVATOR-minimal.zip \
    > /tmp/$ACTIVATOR.zip

# Concerning +rw for /opt/typesafe-activator/: Play writes some files to directories
# within the archive. Otherwise:
#   Error during sbt execution: java.io.IOException: No such file or directory
#   see: http://stackoverflow.com/questions/10559313/play-framework-installation
RUN unzip /tmp/$ACTIVATOR.zip -d /tmp/ && \
    rm -f /tmp/$ACTIVATOR.zip && \
    mkdir /opt/ && \
    mv /tmp/activator-$ACVERSION-minimal /opt/typesafe-activator && \
    chmod -R ugo+rw /opt/typesafe-activator/ && \
    chmod -R ugo+x /opt/typesafe-activator/bin/activator

# Install 'gosu' so we can use it instead of 'su'.
# For unknown reasons, '  exec su ...' no longer works, but 'exec gosu ...' works fine.
RUN apk add --no-cache \
  --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing/ \
  gosu

# Play's HTTP and HTTPS listen ports, Java debugger port, JMX port 3333.
EXPOSE 9000 9443 9999 3333

RUN mkdir -p /opt/talkyard/uploads/ && \
    chmod -R ugo+rw /opt/talkyard/uploads/

WORKDIR /opt/talkyard/app/

COPY entrypoint.sh /docker-entrypoint.sh
RUN  chmod ugo+x   /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

# Overriden in docker-compose.yml
ENV PLAY_HEAP_MEMORY_MB 1048

CMD cd /opt/talkyard/app/ && exec /opt/typesafe-activator/bin/activator \
  -mem $PLAY_HEAP_MEMORY_MB \
  -jvm-debug 9999 \
   # see [30PUK42] in app-prod/Dockerfile
  -Djava.security.egd=file:/dev/./urandom \
  -Dcom.sun.management.jmxremote.port=3333 \
  -Dcom.sun.management.jmxremote.ssl=false \
  -Dcom.sun.management.jmxremote.authenticate=false \
  -Dhttp.port=9000 \
  -Dhttps.port=9443 \
  -Dconfig.file=/opt/talkyard/app/conf/app-dev.conf \
  run

