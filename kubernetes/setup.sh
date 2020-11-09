#!/bin/bash
mkdir -p /data/postgres_volume_master
mkdir -p /data/postgres_volume_slave
kubectl apply -f namespace.yaml
run "kubectl config set-context --current --namespace=botler"
kubectl apply -f initmanifests/
./helmsetup.sh
kubectl apply -f manifests/
