# alias secretcli='docker exec -it secretdev secretcli'
start-local-chain: # CTRL+C to stop
	docker run -it --rm -p 26657:26657 -p 26656:26656 -p 1337:1337 -v $(shell pwd):/root/code --name secretdev enigmampc/secret-network-sw-dev:v1.0.4