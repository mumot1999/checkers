#include <sys/types.h>
#include <sys/wait.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#include <netdb.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <pthread.h>
#include "vec.h"

#define SERVER_PORT 9000
#define QUEUE_SIZE 5


struct room
{
    char name[30];
    char fen[200];
    struct connection* connections;
};

struct connection
{
    int connection_socket_descriptor;
    char login[30];
    char room[30];
};

struct connection* connections;
struct room* rooms;

struct thread_data_t
{
    int connection_socket_descriptor;
};

bool isAction(char* x, char* action){
    for (int i = 0; i < strlen(action); ++i) {
        if(*(x+i) != action[i])
            return 0;
    }
    return 1;
}

char *multiple(char *str, char *s2)
{
    int len;
    char *s;
    if (str != NULL)
        len = strlen(str);
    len += strlen(s2) + 1 * sizeof(*s2);
    s = realloc(str, len);
    strcat(s, s2);
    return s;
}

void send_data(int socket_, char* action, char* data){
    char* buf = multiple(NULL, "");

    multiple(buf, action);
    multiple(buf, "\n");
    multiple(buf, data);
    write(socket_, buf, strlen(buf));
    free(buf);
}

char* getRooms(){
    char* buf = multiple(NULL, "");
    foreach(struct room room, rooms){
            multiple(buf, room.name);
            multiple(buf, ",");
        }
    buf[strlen(buf)-1] = 0;
    return buf;
}

void *ThreadBehavior(void *t_data)
{
    pthread_detach(pthread_self());
    struct thread_data_t *th_data = (struct thread_data_t*)t_data;
    char buf[1000];
    char action[30], data[100];

    struct connection* user;
    struct room* users_room;

    while(1) {
        users_room = 0;
        user = 0;
        int is_connection_open = read(th_data->connection_socket_descriptor, buf, 300);

        if(is_connection_open == -1 || is_connection_open == 0){
            break;
        }else{
            for (int i = 0; i < vector_size(connections); ++i) {
                if (connections[i].connection_socket_descriptor == th_data->connection_socket_descriptor){
                    user = &connections[i];
                    break;
                }
            }
            for (int i = 0; i < vector_size(rooms); ++i) {
                if (!strcmp(rooms[i].name, user->room)){
                    users_room = &rooms[i];
                    break;
                }
            }

            if(!buf[0])
                break;

            for (int i = 0; i < 100; ++i) {
                data[i] = 0;
            }
            for (int i = 0; i < 30; ++i) {
                action[i] = 0;
            }

            sscanf(buf, "%s\n%s", action, data);
            printf("action: %s\n", action);
            printf("data: %s\n", data);
            if(isAction(action, "getRooms")){
                send_data(th_data->connection_socket_descriptor, "rooms", getRooms());
            }else if(isAction(action, "fen")){
                if(users_room){
                    strcpy(users_room->fen, data);
                    foreach(struct connection con, connections) {
                            if(con.connection_socket_descriptor != th_data->connection_socket_descriptor
                               && !strcmp(con.room, user->room)
                                    ){
                                send_data(con.connection_socket_descriptor, "fen", data);
                            }
                        }
                }
            }else if(isAction(action, "selectRoom")){
                strcpy(user->room, &data[0]);
                foreach(struct room room, rooms){
                        if(!strcmp(room.name, data)){
                            send_data(user->connection_socket_descriptor, "fen", room.fen);
                        }
                    }
            }
        }
    }

    free(th_data);
    pthread_exit(NULL);
}

void handleConnection(int connection_socket_descriptor) {
    int create_result = 0;
    char buf[100];
    pthread_t thread1;

    struct thread_data_t * t_data = (struct thread_data_t *) malloc(sizeof(struct thread_data_t));
    t_data->connection_socket_descriptor = connection_socket_descriptor;

    create_result = pthread_create(&thread1, NULL, ThreadBehavior, (void *)t_data);
    if (create_result){
        printf("Błąd przy próbie utworzenia wątku, kod błędu: %d\n", create_result);
        exit(-1);
    }
}

int main(int argc, char* argv[])
{
    int server_socket_descriptor;
    int connection_socket_descriptor;
    int bind_result;
    int listen_result;
    char reuse_addr_val = 1;
    int server_port = 9000;
    struct sockaddr_in server_address;

    connections = vector_create();
    rooms = vector_create();
    //inicjalizacja gniazda serwera

    memset(&server_address, 0, sizeof(struct sockaddr));
    server_address.sin_family = AF_INET;
    server_address.sin_addr.s_addr = htonl(INADDR_ANY);
    server_address.sin_port = htons(SERVER_PORT);

    server_socket_descriptor = socket(AF_INET, SOCK_STREAM, 0);
    if (server_socket_descriptor < 0)
    {
        fprintf(stderr, "%s: Błąd przy próbie utworzenia gniazda..\n", argv[0]);
        exit(1);
    }
    setsockopt(server_socket_descriptor, SOL_SOCKET, SO_BROADCAST, (char*)&reuse_addr_val, sizeof(reuse_addr_val));

    while (bind(server_socket_descriptor, (struct sockaddr*)&server_address, sizeof(struct sockaddr)) < 0)
    {
        server_address.sin_port = htons(++server_port);
        fprintf(stderr, "%s: Błąd przy próbie dowiązania adresu IP i numeru portu do gniazda.\n Nowy port: %d", argv[0], server_port);
    }

    listen_result = listen(server_socket_descriptor, QUEUE_SIZE);
    if (listen_result < 0) {
        fprintf(stderr, "%s: Błąd przy próbie ustawienia wielkości kolejki.\n", argv[0]);
        exit(1);
    }

    struct room room_;
    room_.connections = vector_create();
    strcpy(room_.name, "Default");
    vector_add(&rooms, room_);

    while(1)
    {
        struct connection connection;
        connection.connection_socket_descriptor = connection_socket_descriptor;

        connection_socket_descriptor = accept(server_socket_descriptor, NULL, NULL);
        printf("Nowe polaczenie\n");

        if (connection_socket_descriptor < 0)
        {
            fprintf(stderr, "%s: Błąd przy próbie utworzenia gniazda dla połączenia.\n", argv[0]);
            exit(1);
        }

        struct connection* new_connection = vector_add_asg(&connections);
        new_connection->connection_socket_descriptor = connection_socket_descriptor;
        new_connection = NULL;

        handleConnection(connection_socket_descriptor);

    }
    close(server_socket_descriptor);
    return(0);
}