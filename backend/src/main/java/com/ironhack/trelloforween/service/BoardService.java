package com.ironhack.trelloforween.service;

import com.ironhack.trelloforween.entity.*;
import com.ironhack.trelloforween.repository.*;
import com.ironhack.trelloforween.exception.BoardNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final UserRepository userRepository;

    @Transactional
    public Board createBoard(String name, String description, String accentColor, User owner) {
        Board board = Board.builder()
                .name(name)
                .description(description)
                .accentColor(accentColor)
                .owner(owner)
                .build();
        Board savedBoard = boardRepository.save(board);

        // Add creator as board member
        BoardMember member = BoardMember.builder()
                .board(savedBoard)
                .user(owner)
                .build();
        boardMemberRepository.save(member);

        // Create default columns
        String[] defaultColumns = {"Todo", "In Progress", "Review", "Done", "Blocked"};
        for (int i = 0; i < defaultColumns.length; i++) {
            BoardColumn column = BoardColumn.builder()
                    .name(defaultColumns[i])
                    .board(savedBoard)
                    .position(i)
                    .build();
            boardColumnRepository.save(column);
        }

        return savedBoard;
    }

    public List<Board> getMyBoards(User user) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            return boardRepository.findAll();
        }
        List<Board> owned = boardRepository.findByOwnerId(user.getId());
        List<Board> memberOf = boardMemberRepository.findByUserId(user.getId())
                .stream()
                .map(BoardMember::getBoard)
                .toList();
        
        List<Board> all = new ArrayList<>(owned);
        for (Board b : memberOf) {
            if (!all.contains(b)) {
                all.add(b);
            }
        }
        return all;
    }

    public Board getBoardById(Long id) {
        return boardRepository.findById(id)
                .orElseThrow(() -> new BoardNotFoundException("Board not found"));
    }

    @Transactional
    public Board updateBoard(Long id, Board details) {
        Board board = getBoardById(id);
        board.setName(details.getName());
        board.setDescription(details.getDescription());
        board.setAccentColor(details.getAccentColor());
        return boardRepository.save(board);
    }

    @Transactional
    public void deleteBoard(Long id) {
        boardRepository.deleteById(id);
    }

    @Transactional
    public BoardMember addMember(Long boardId, Long userId) {
        Board board = getBoardById(boardId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (boardMemberRepository.existsByBoardIdAndUserId(boardId, userId)) {
            return null; // Already a member
        }

        BoardMember member = BoardMember.builder()
                .board(board)
                .user(user)
                .build();
        return boardMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long boardId, Long userId) {
        boardMemberRepository.deleteByBoardIdAndUserId(boardId, userId);
    }

    public List<User> getBoardMembers(Long boardId) {
        return boardMemberRepository.findByBoardId(boardId)
                .stream()
                .map(BoardMember::getUser)
                .toList();
    }
}
