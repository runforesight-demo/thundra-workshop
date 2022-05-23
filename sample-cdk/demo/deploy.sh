#!/bin/bash -ex
set -x
set -e

export PROFILE=demo

pushd ../

./deploy.sh

popd
