import enum
from sqlalchemy import ForeignKey, Column, Integer, String, DateTime, Boolean, func, Enum, Text, Index, Numeric
from sqlalchemy.dialects.mysql import BIGINT, INTEGER, NUMERIC, CHAR
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Address(Base):
    __tablename__ = "addresses"

    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    address = Column(CHAR(42), nullable=False, index=True, unique=True)
    __table_args__ = (
        Index('address_idx', 'address', unique=True, mysql_length=42),
    )


class Balance(Base):
    __tablename__ = "balances"

    address_id = Column(INTEGER(unsigned=True), ForeignKey('addresses.id'), primary_key=True)
    address = relationship("Address", foreign_keys=[address_id])
    balance_date = Column(BIGINT(unsigned=True), nullable=False, primary_key=True)
    delta = Column(NUMERIC(32, unsigned=False), nullable=False)


class ValidateStatus(Base):
    __tablename__ = "validate_status"

    id = Column(INTEGER(unsigned=True), primary_key=True, autoincrement=True)
    current_full_validate_block = Column(INTEGER(unsigned=True), nullable=False)
