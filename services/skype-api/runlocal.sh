#!/bin/zsh
export $(xargs <.env )
sls offline
