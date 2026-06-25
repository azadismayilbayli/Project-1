#!/usr/bin/env python3
import curses
import random
from collections import deque

def main(stdscr):
    curses.curs_set(0)
    stdscr.nodelay(True)
    stdscr.timeout(120)
    curses.init_pair(1, curses.COLOR_GREEN, curses.COLOR_BLACK)
    curses.init_pair(2, curses.COLOR_RED, curses.COLOR_BLACK)
    curses.init_pair(3, curses.COLOR_YELLOW, curses.COLOR_BLACK)

    height, width = stdscr.getmaxyx()
    box_top, box_left = 2, 1
    box_bottom, box_right = height - 2, width - 2

    snake = deque([(height // 2, width // 2 + i) for i in range(-2, 3)])
    direction = curses.KEY_RIGHT
    score = 0

    def place_food():
        while True:
            pos = (random.randint(box_top + 1, box_bottom - 1),
                   random.randint(box_left + 1, box_right - 1))
            if pos not in snake:
                return pos

    food = place_food()

    opposite = {
        curses.KEY_UP: curses.KEY_DOWN, curses.KEY_DOWN: curses.KEY_UP,
        curses.KEY_LEFT: curses.KEY_RIGHT, curses.KEY_RIGHT: curses.KEY_LEFT,
    }

    while True:
        stdscr.erase()
        stdscr.attron(curses.color_pair(3))
        stdscr.border()
        stdscr.attroff(curses.color_pair(3))
        stdscr.addstr(0, 2, f" SNAKE | Score: {score} ", curses.color_pair(3) | curses.A_BOLD)
        stdscr.addstr(height - 1, 2, " Arrow keys to move | Q to quit ", curses.color_pair(3))

        for y, x in snake:
            try:
                stdscr.addch(y, x, "O", curses.color_pair(1) | curses.A_BOLD)
            except curses.error:
                pass

        try:
            stdscr.addch(food[0], food[1], "*", curses.color_pair(2) | curses.A_BOLD)
        except curses.error:
            pass

        stdscr.refresh()

        key = stdscr.getch()
        if key in (ord("q"), ord("Q")):
            return
        if key in opposite and key != opposite.get(direction):
            direction = key

        head_y, head_x = snake[-1]
        if direction == curses.KEY_UP:
            head_y -= 1
        elif direction == curses.KEY_DOWN:
            head_y += 1
        elif direction == curses.KEY_LEFT:
            head_x -= 1
        elif direction == curses.KEY_RIGHT:
            head_x += 1

        if (head_y <= box_top or head_y >= box_bottom or
                head_x <= box_left or head_x >= box_right or
                (head_y, head_x) in snake):
            stdscr.nodelay(False)
            stdscr.addstr(height // 2, width // 2 - 7, " GAME OVER! ", curses.A_BOLD | curses.A_REVERSE)
            stdscr.addstr(height // 2 + 1, width // 2 - 10, " Press any key to exit ", curses.A_DIM)
            stdscr.refresh()
            stdscr.getch()
            return

        snake.append((head_y, head_x))
        if (head_y, head_x) == food:
            score += 10
            food = place_food()
        else:
            snake.popleft()

if __name__ == "__main__":
    curses.wrapper(main)
