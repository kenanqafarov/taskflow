package com.ironhack.trelloforween.service;

import com.ironhack.trelloforween.entity.Board;
import com.ironhack.trelloforween.entity.BoardColumn;
import com.ironhack.trelloforween.repository.BoardColumnRepository;
import com.ironhack.trelloforween.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardColumnService {

    private final BoardColumnRepository boardColumnRepository;
    private final BoardRepository boardRepository;

    public List<BoardColumn> getColumnsByBoard(Long boardId) {
        return boardColumnRepository.findByBoardIdOrderByPositionAsc(boardId);
    }

    @Transactional
    public BoardColumn createColumn(Long boardId, String name) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new RuntimeException("Board not found"));
        
        List<BoardColumn> columns = boardColumnRepository.findByBoardIdOrderByPositionAsc(boardId);
        int position = columns.size(); // Add to the end

        BoardColumn column = BoardColumn.builder()
                .name(name)
                .board(board)
                .position(position)
                .build();
        return boardColumnRepository.save(column);
    }

    @Transactional
    public BoardColumn renameColumn(Long columnId, String newName) {
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new RuntimeException("Column not found"));
        column.setName(newName);
        return boardColumnRepository.save(column);
    }

    @Transactional
    public void deleteColumn(Long columnId) {
        boardColumnRepository.deleteById(columnId);
    }
}
