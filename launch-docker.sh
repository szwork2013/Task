docker build -t hivepod/app0 .

docker rm -f db app_1 app_2 lb

docker run --name db    -d -P dockerfile/mongodb
docker run --name app_1 -d -P --link db:db hivepod/app0 
docker run --name app_2 -d -P --link db:db hivepod/app0 
docker run --name lb    -d -p "80:80" --link app_1:app_1 --link app_2:app_2 -e "APP_PATH=/" jasonwyatt/nginx-loadbalancer

echo 'IPs: -----'
echo 'app_1 ip:' `docker inspect --format '{{ .NetworkSettings.IPAddress }}' app_1` \
     ', app_2 ip:' `docker inspect --format '{{ .NetworkSettings.IPAddress }}' app_2` \
     ', lb    ip:' `docker inspect --format '{{ .NetworkSettings.IPAddress }}' lb`

curl `docker inspect --format '{{ .NetworkSettings.IPAddress }}' lb`/ping
