package com.ironhack.trelloforween.controller;

import com.ironhack.trelloforween.entity.*;
import com.ironhack.trelloforween.service.BoardColumnService;
import com.ironhack.trelloforween.service.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;
    private final BoardColumnService boardColumnService;

    @PostMapping
    public ResponseEntity<Board> createBoard(@RequestBody Board board, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(boardService.createBoard(
                board.getName(), 
                board.getDescription(), 
                board.getAccentColor(), 
                user
        ));
    }

    @GetMapping
    public ResponseEntity<List<Board>> getMyBoards(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(boardService.getMyBoards(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Board> getBoardById(@PathVariable Long id) {
        return ResponseEntity.ok(boardService.getBoardById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Board> updateBoard(@PathVariable Long id, @RequestBody Board board) {
        return ResponseEntity.ok(boardService.updateBoard(id, board));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(@PathVariable Long id) {
        boardService.deleteBoard(id);
        return ResponseEntity.noContent().build();
    }

    // Column endpoints
    @GetMapping("/{boardId}/columns")
    public ResponseEntity<List<BoardColumn>> getColumns(@PathVariable Long boardId) {
        return ResponseEntity.ok(boardColumnService.getColumnsByBoard(boardId));
    }

    @PostMapping("/{boardId}/columns")
    public ResponseEntity<BoardColumn> createColumn(@PathVariable Long boardId, @RequestParam String name) {
        return ResponseEntity.ok(boardColumnService.createColumn(boardId, name));
    }

    @PutMapping("/{boardId}/columns/{columnId}")
    public ResponseEntity<BoardColumn> renameColumn(
            @PathVariable Long boardId,
            @PathVariable Long columnId,
            @RequestParam String name) {
        return ResponseEntity.ok(boardColumnService.renameColumn(columnId, name));
    }

    @DeleteMapping("/{boardId}/columns/{columnId}")
    public ResponseEntity<Void> deleteColumn(@PathVariable Long boardId, @PathVariable Long columnId) {
        boardColumnService.deleteColumn(columnId);
        return ResponseEntity.noContent().build();
    }

    // Board Members endpoints
    @GetMapping("/{boardId}/members")
    public ResponseEntity<List<User>> getMembers(@PathVariable Long boardId) {
        return ResponseEntity.ok(boardService.getBoardMembers(boardId));
    }

    @PostMapping("/{boardId}/members")
    public ResponseEntity<BoardMember> addMember(@PathVariable Long boardId, @RequestParam Long userId) {
        BoardMember member = boardService.addMember(boardId, userId);
        if (member == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(member);
    }

    @DeleteMapping("/{boardId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long boardId, @PathVariable Long userId) {
        boardService.removeMember(boardId, userId);
        return ResponseEntity.noContent().build();
    }
}
