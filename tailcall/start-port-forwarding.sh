#!/usr/bin/env bash

gcloud container clusters get-credentials s-cluster-2 --zone us-east4-b --project s-artnetapps-99
kubectl port-forward svc/staging-rc1-coredata-manager-grpc 5210:5210
