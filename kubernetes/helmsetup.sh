#!/bin/bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install botler-postgresql -f postgresoptions.yaml bitnami/postgresql
