package com.ironhack.trelloforween.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "task_labels")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskLabel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String color; // hex code or color name

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "board_id")
    private Board board;
}
