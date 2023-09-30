# alias secretcli='docker exec -it secretdev secretcli'
start-local-chain: # CTRL+C to stop
	docker run -it --rm -p 9091:9091 -p 26657:26657 -p 26656:26656 -p 1317:1317 -p 5000:5000 -v $(shell pwd):/root/code --name localsecret ghcr.io/scrtlabs/localsecret
