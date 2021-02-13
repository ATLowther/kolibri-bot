build-docker-image:
	docker build --platform=linux/amd64 -t kolibri-monitor-ws .

bash:
	docker run --platform=linux/amd64 --rm -it -v $$(pwd):/shared --workdir /shared -p 9229:9229 -p 4000:4000 kolibri-monitor-ws bash

run:
	docker run --platform=linux/amd64 --rm -it -v $$(pwd):/shared --init --workdir /shared -p 9229:9229 -p 4000:4000 kolibri-monitor-ws npm run serve

debug:
	docker run --platform=linux/amd64 --rm -it -v $$(pwd):/shared --init --workdir /shared -p 9229:9229 -p 4000:4000 kolibri-monitor-ws node --inspect=0.0.0.0 src/index.js
