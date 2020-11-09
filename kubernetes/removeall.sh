#!/bin/bash
helm delete botler-postgresql &
kubectl delete pvc --all &
kubectl delete -f initmanifests &
kubectl delete -f manifests &
