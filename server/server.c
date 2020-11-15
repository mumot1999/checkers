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
    int black_player_socket_descriptor;
    int white_player_socket_descriptor;
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
    len += strlen(s2) ;
    len += 1 * sizeof(*s2);
    s = realloc(str, len);
    strcat(s, s2);
    return s;
}

void send_data(int socket_, char* action, char* data){
    char* buf = multiple(NULL, action);
    multiple(buf, "\n");
    multiple(buf, data);
    usleep(30000);
    write(socket_, buf, strlen(buf));
//    free(buf);
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

void emitPlayersColors(struct room* room){
    char whitePlayer[100];
    char blackPlayer[100];
    memset(blackPlayer,0,sizeof(blackPlayer));
    memset(whitePlayer,0,sizeof(whitePlayer));

    foreach(struct connection con, connections) {
            if(!strcmp(con.room, room->name)){
                if(room->white_player_socket_descriptor == con.connection_socket_descriptor){
                    strcpy(whitePlayer, con.login);
                }else if(room->black_player_socket_descriptor == con.connection_socket_descriptor){
                    strcpy(blackPlayer, con.login);
                }
            }
        }
    foreach(struct connection con, connections) {
            if(!strcmp(con.room, room->name)){
                send_data(con.connection_socket_descriptor, "whitePlayer", whitePlayer);
                send_data(con.connection_socket_descriptor, "blackPlayer", blackPlayer);
            }
        }


}

void clean_user_room(struct connection* user){
    struct room* room;
    for (int i = 0; i < vector_size(rooms); ++i) {
        if (!strcmp(rooms[i].name, user->room)){
            room = &(rooms[i]);
            if(room->black_player_socket_descriptor == user->connection_socket_descriptor){
                room->black_player_socket_descriptor = 0;
            }else if(room->white_player_socket_descriptor == user->connection_socket_descriptor){
                room->white_player_socket_descriptor = 0;
            }
            emitPlayersColors(room);
            break;
        }
    }
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

        if(is_connection_open == -1 || is_connection_open == 0){
            for (int i = 0; i < vector_size(connections); ++i) {
                if(connections[i].connection_socket_descriptor == user->connection_socket_descriptor){
                    vector_remove(connections, i);
                }
            }
            clean_user_room(user);
            break;
        }else{


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
                    char turn = users_room->fen[0] == 'B' ? 'b' : 'w';
                    if(users_room->white_player_socket_descriptor == user->connection_socket_descriptor){
                        if(turn == 'w')
                            strcpy(users_room->fen, data);
                    }
                    if(users_room->black_player_socket_descriptor == user->connection_socket_descriptor){
                        if(turn == 'b')
                            strcpy(users_room->fen, data);
                    }
                    foreach(struct connection con, connections) {
                            if(!strcmp(con.room, user->room)){
                                send_data(con.connection_socket_descriptor, "fen", users_room->fen);
                            }
                        }
                }
            }else if(isAction(action, "selectRoom")){
                clean_user_room(user);
                strcpy(user->room, &data[0]);
                foreach(struct room room, rooms){
                        if(!strcmp(room.name, data)){
                            send_data(user->connection_socket_descriptor, "fen", room.fen);
                            emitPlayersColors(&room);
                        }
                    }
            }else if(isAction(action, "selectColor")){
                if(users_room){
                    clean_user_room(user);
                    if(isAction(data, "black")){
                        if(users_room->black_player_socket_descriptor == 0){
                            users_room->black_player_socket_descriptor = user->connection_socket_descriptor;
                        }
                    }else if(isAction(data, "white")){
                        if(users_room->white_player_socket_descriptor == 0){
                            users_room->white_player_socket_descriptor = user->connection_socket_descriptor;
                        }
                    }
                    emitPlayersColors(users_room);
                }
            }else if(isAction(action, "login")){
                strcpy(user->login, &data[0]);
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

    struct room* new_room = vector_add_asg(&rooms);
    strcpy(new_room->name, "Pokoj1");
    new_room = NULL;

    new_room = vector_add_asg(&rooms);
    strcpy(new_room->name, "Pokoj2");
    new_room = NULL;

    new_room = vector_add_asg(&rooms);
    strcpy(new_room->name, "Pokoj3");
    new_room = NULL;

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